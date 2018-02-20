import {APIDescription, APIEndPoint} from "../../../";
import * as express from "express";
import {IWrapperMiddleware} from "./middleware/IWrapperMiddleware";
import {RequestBodyChecker} from "./middleware/RequestBodyChecker";
import {DBConnectionCleaner} from "./middleware/DBConnectionCleaner";
import {DBConnectionProvider} from "./middleware/DBConnectionProvider";
import {IRequestWrapper} from "./IRequestWrapper";

export class RequestWrapper implements IRequestWrapper {


    public readonly middlewares: Array<IWrapperMiddleware> = [];

    constructor(api: APIDescription) {
        this.middlewares.push(new RequestBodyChecker());
        this.middlewares.push(new DBConnectionProvider(api));
        this.middlewares.push(new DBConnectionCleaner());
    }

    /**
     * Wrap every call on an API end-point
     * @param {APIEndPoint} endPoint
     * @param {e.Request} req
     * @param {e.Response} res
     * @param {NextFunction} next
     * @TODO Refactor
     */
    public wrap(endPoint: APIEndPoint, req: express.Request, res: express.Response, next: express.NextFunction): void {
        // building promises
        const promises: Promise<void>[] = this.middlewares.map(
            middleware => middleware.middleware(endPoint, req, res)
        );

        // waiting for promises
        Promise.all(promises)
            .then(() => {
                endPoint.handler(req, res, next);
            }).catch((reason: Error) => {
                res.json({error: {message: "Request wrapper error: " + reason.message}});
            });
    }
}