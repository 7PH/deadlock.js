import {Preprocessor} from "./Preprocessor";
import * as express from "express";
import {APIEndPoint} from "../../../../";

export class RequestInitializer implements Preprocessor {
    async preprocess(endPoint: APIEndPoint, req: express.Request, res: express.Response): Promise<void> {
        res.locals.dl = {ip: req.connection.remoteAddress || "UNDEFINED"};
    }

}