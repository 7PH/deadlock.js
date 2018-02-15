import {RequestHandler, Request, Response} from "express";
import {NextFunction} from "express-serve-static-core";

export class GateKeeper {

    public static requests: Map<string, Map<NextFunction, boolean>> = new Map();

    public static middle: RequestHandler = function(req: Request, res: Response, next: NextFunction) {

        const ip: string = req.connection.remoteAddress || '';
        let pending: Map<NextFunction, boolean>;

        function startRequest(n: NextFunction) {
            pending.set(n, true);
            n();
        }

        // add the request to the list of pending requests
        if (typeof GateKeeper.requests.get(ip) == 'undefined')
            GateKeeper.requests.set(ip, new Map());
        pending = GateKeeper.requests.get(ip) as Map<NextFunction, boolean>;
        pending.set(next, false);

        // if no waiting request
        if (pending.size <= 1)
            startRequest(next);

        // when the request finishes
        res.on('finish', () => {
            // remove the request from the list of pending requests
            pending.delete(next);
            // if no pending request, delete this ip queue
            if (pending.size == 0) GateKeeper.requests.delete(ip);
            else {
                // if there are requests waiting or executing, find one
                let waiting: NextFunction[] = Array.from(pending.keys()).filter((n: NextFunction) => ! pending.get(n));
                if (waiting.length > 0) {
                    // there are at least one request waiting
                    startRequest(waiting[0]);
                }
            }
        });
    };
}