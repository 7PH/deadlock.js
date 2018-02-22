import {IPreprocessor} from "./IPreprocessor";
import * as express from "express";
import {APIEndPoint} from "../../../../";

export class RequestInitializer implements IPreprocessor {
    preprocess(endPoint: APIEndPoint, req: express.Request, res: express.Response): Promise<any> {
        res.locals.dl = {};
        return Promise.resolve();
    }

}