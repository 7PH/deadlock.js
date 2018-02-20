import {APIDescription, APIEndPoint} from "../../../";
import * as express from "express";
import {IWrapperMiddleware} from "./preprocessor/IWrapperMiddleware";
import {RequestBodyChecker} from "./preprocessor/RequestBodyChecker";
import {DBConnectionCleaner} from "./preprocessor/DBConnectionCleaner";
import {DBConnectionProvider} from "./preprocessor/DBConnectionProvider";
import {IRequestWrapper} from "./IRequestWrapper";

export class RequestWrapper implements IRequestWrapper {


    public readonly preprocessors: Array<IWrapperMiddleware> = [];

    constructor(api: APIDescription) {
        this.preprocessors.push(new RequestBodyChecker());
        this.preprocessors.push(new DBConnectionProvider(api));
        this.preprocessors.push(new DBConnectionCleaner());
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
        const promises: Promise<void>[] = this.preprocessors.map(
            preprocessor => preprocessor.middleware(endPoint, req, res)
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