import {APIEndPoint} from "../description/APIEndPoint";
import {RequestWrapper} from "./RequestWrapper";
import * as express from "express";

/**
 * Simple Request Wrapper
 * @TODO Refactor SimpleRequestWrapper and MySQLRequestWrapper. Bad thinking creating these classes like this
 */
export class SimpleRequestWrapper implements RequestWrapper {

    protected validateParameters(endPoint: APIEndPoint, req: express.Request, res: express.Response, next: () => any): void {
        if (endPoint.paramFilter) {
            const filtered: any = endPoint.paramFilter.mask(req.body);
            if (typeof filtered !== 'undefined') {
                res.locals.params = filtered;
                next();
            } else {
                // not ok
                res.json({error: {message: "Error parsing parameters. Please match the specified filter.", filter: endPoint.paramFilter}});
            }
        } else {
            // ok
            next();
        }
    }

    public bindHandler(endPoint: APIEndPoint, req: express.Request, res: express.Response, next: express.NextFunction): void {
        this.validateParameters(endPoint, req, res, () => {
            endPoint.handler(req, res, next);
        });
    }
}