import {RequestHandler, Request, Response} from "express";
import {NextFunction} from "express-serve-static-core";

/** The GateKeeper provides a simple way to mitigate http flood,
 *      by delaying requests so only one can be executed at a time.
 *  Use this middleware with nginx (for instance) to limit the number of simultaneous active TCP connections
 *      in order to drop the unwanted traffic. */
export class GateKeeper {

    /** Currently actives (waiting or executing) requests per IP */
    public static requests: Map<string, Map<NextFunction, boolean>> = new Map();

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
    private static getPendingRequests(identifier: string, createIfNull?: boolean): Map<NextFunction, boolean> {
        if (createIfNull && typeof GateKeeper.requests.get(identifier) === 'undefined')
            GateKeeper.requests.set(identifier, new Map());
        return GateKeeper.requests.get(identifier) || new Map();
    }

    /** Limit the number of simultaneous active requests */
    private static delayRequest(identifier: string, res: Response, next: NextFunction) {
        const pending: Map<NextFunction, boolean> = GateKeeper.getPendingRequests(identifier, true);

        // add the request to the list of pending requests
        pending.set(next, false);

        // if no waiting request
        if (pending.size <= 1)
            GateKeeper.executeRequest(identifier, next);
        else {
            console.log("Delaying request (identifier=" + identifier +") - " + pending.size + " pending requests");
        }

        // when the request finishes
        res.on('close', GateKeeper.onRequestFinished.bind(this, identifier, next));
        res.on('finish', GateKeeper.onRequestFinished.bind(this, identifier, next));
    }

    /** Starts the execution of a request */
    private static executeRequest(identifier: string, next: NextFunction) {
        const pending: Map<NextFunction, boolean> = GateKeeper.getPendingRequests(identifier);
        pending.set(next, true);
        next();
    }

    /** When a request is done */
    private static onRequestFinished(identifier: string, next: NextFunction) {
        const pending: Map<NextFunction, boolean> = GateKeeper.getPendingRequests(identifier);
        // remove the request from the list of pending requests
        pending.delete(next);
        // if no pending request, delete this ip queue
        if (pending.size === 0) GateKeeper.requests.delete(identifier);
        else {
            // if there are requests waiting or executing, find one
            let waiting: NextFunction[] = Array.from(pending.keys()).filter((n: NextFunction) => ! pending.get(n));
            if (waiting.length > 0) {
                // there are at least one request waiting
                GateKeeper.executeRequest(identifier, waiting[0]);
            }
        }
    }
}