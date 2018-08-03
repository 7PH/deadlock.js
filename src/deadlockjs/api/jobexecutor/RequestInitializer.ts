import {JobExecutor} from "./JobExecutor";
import * as express from "express";
import {APIEndPoint} from "../../../index";

export class RequestInitializer implements JobExecutor {


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