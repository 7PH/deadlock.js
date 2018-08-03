import {Preprocessor} from "./Preprocessor";
import * as express from "express";
import {APIEndPoint} from "../../../../";

export class RequestInitializer implements Preprocessor {


    public async preprocess(endPoint: APIEndPoint, req: express.Request, res: express.Response): Promise<void> {

        res.locals.dl = {

            requestInfo: {

                ip: req.connection.remoteAddress || "",

                time: new Date().getTime() / 1000,

                params: { }
            },

            express: {

                req: req,

                res: res
            }
        };
    }

}