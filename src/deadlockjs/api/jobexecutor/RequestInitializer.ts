import {JobExecutor} from "./JobExecutor";
import * as express from "express";
import {APIEndPoint} from "../../../index";

export class RequestInitializer extends JobExecutor {


    public async execute(endPoint: APIEndPoint, req: express.Request, res: express.Response): Promise<void> {

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
