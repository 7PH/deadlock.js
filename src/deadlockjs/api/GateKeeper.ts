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
    public static middle: RequestHandler = function(req: Request, res: Response, next: NextFunction) {
        GateKeeper.delayRequest(req, res, next);
    };

    /** Limit the number of simultaneous active requests */
    private static delayRequest(req: Request, res: Response, next: NextFunction) {
        const identifier: string = req.connection.remoteAddress || '';
        let pending: Map<NextFunction, boolean>;

        function startRequest(n: NextFunction) {
            pending.set(n, true);
            n();
        }

        // add the request to the list of pending requests
        if (typeof GateKeeper.requests.get(identifier) === 'undefined')
            GateKeeper.requests.set(identifier, new Map());
        pending = GateKeeper.requests.get(identifier) as Map<NextFunction, boolean>;
        pending.set(next, false);

        // if no waiting request
        if (pending.size <= 1)
            startRequest(next);

        // when the request finishes
        res.on('finish', () => {
            // remove the request from the list of pending requests
            pending.delete(next);
            // if no pending request, delete this ip queue
            if (pending.size == 0) GateKeeper.requests.delete(identifier);
            else {
                // if there are requests waiting or executing, find one
                let waiting: NextFunction[] = Array.from(pending.keys()).filter((n: NextFunction) => ! pending.get(n));
                if (waiting.length > 0) {
                    // there are at least one request waiting
                    startRequest(waiting[0]);
                }
            }
        });
    }
}