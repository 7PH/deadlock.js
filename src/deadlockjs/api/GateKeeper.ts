import {RequestHandler, Request, Response} from "express";
import {NextFunction} from "express-serve-static-core";


export enum RequestState {DELAYED, EXECUTING, ABORTED}

/** The GateKeeper provides a simple way to mitigate http flood,
 *      by delaying requests so only one can be executed at a time.
 *  Use this middleware with nginx (for instance) to limit the number of simultaneous active TCP connections
 *      in order to drop the unwanted traffic.
 */
export class GateKeeper {

    static get REQUEST_ABORT_PENALTY_MS() { return 1000; }

    static get SIMULTANEOUS_REQUESTS_ALLOWED_COUNT() { return 2; }

    /** Currently actives (waiting or executing) requests per IP */
    public static requests: Map<string, Map<NextFunction, RequestState>> = new Map();

    /** Middleware to register in your API Description */
    public static DoS: RequestHandler = function(req: Request, res: Response, next: NextFunction) {
        GateKeeper.delayRequestByIp(req, res, next);
    };

    /** Delay a request by IP */
    private static delayRequestByIp(req: Request, res: Response, next: NextFunction) {
        const identifier: string = 'ip@' + req.connection.remoteAddress || 'null';
        GateKeeper.delayRequest(identifier, res, next);
    }

    /** Retrieve map of (NextFunction -> true|false) of pending requests */
    private static getPendingRequests(identifier: string, createIfNull?: boolean): Map<NextFunction, RequestState> {
        if (createIfNull && typeof GateKeeper.requests.get(identifier) === 'undefined')
            GateKeeper.requests.set(identifier, new Map());
        return GateKeeper.requests.get(identifier) || new Map();
    }

    /** Limit the number of simultaneous active requests */
    private static delayRequest(identifier: string, res: Response, next: NextFunction) {
        const pending: Map<NextFunction, RequestState> = GateKeeper.getPendingRequests(identifier, true);

        // add the request to the list of pending requests
        pending.set(next, RequestState.DELAYED);

        // if no waiting request
        if (pending.size <= GateKeeper.SIMULTANEOUS_REQUESTS_ALLOWED_COUNT)
            GateKeeper.executeRequest(identifier, next);

        // request aborted
        res.on('close', () => {
            pending.set(next, RequestState.ABORTED);
            // add a penalty time
            setTimeout(
                GateKeeper.onRequestFinished.bind(this, identifier, next),
                GateKeeper.REQUEST_ABORT_PENALTY_MS);
        });

        // request finished
        res.on('finish', GateKeeper.onRequestFinished.bind(this, identifier, next));
    }

    /** Starts the execution of a request */
    private static executeRequest(identifier: string, next: NextFunction) {
        const pending: Map<NextFunction, RequestState> = GateKeeper.getPendingRequests(identifier);
        pending.set(next, RequestState.EXECUTING);
        next();
    }

    /** When a request is done */
    private static onRequestFinished(identifier: string, next: NextFunction) {
        const pending: Map<NextFunction, RequestState> = GateKeeper.getPendingRequests(identifier);
        if (! pending.has(next)) {
            // request already cleaned up
            return;
        }
        if (pending.get(next) == RequestState.ABORTED) {
            // request was aborted
        }
        // remove the request from the list of pending requests
        pending.delete(next);
        // if no pending request, delete this ip queue
        if (pending.size === 0) GateKeeper.requests.delete(identifier);
        else {
            // if there are requests waiting or executing, find one
            let waiting: NextFunction[] = Array.from(pending.keys())
                .filter((n: NextFunction) => pending.get(n) == RequestState.DELAYED);
            if (waiting.length > 0 && pending.size - waiting.length <= GateKeeper.SIMULTANEOUS_REQUESTS_ALLOWED_COUNT - 1) {
                // there are at least one request waiting
                GateKeeper.executeRequest(identifier, waiting[0]);
            }
        }
    }
}