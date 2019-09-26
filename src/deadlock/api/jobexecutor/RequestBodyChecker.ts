import {JobExecutor} from "./JobExecutor";
import {APIEndPoint} from "../../../index";
import * as express from "express";

export class RequestBodyChecker extends JobExecutor {

    public async execute (endPoint: APIEndPoint, req: express.Request, res: express.Response): Promise<void> {

        let filtered: any = {};

        if (typeof endPoint.paramFilter !== 'undefined') {
            try {
                filtered = endPoint.paramFilter.mask(req.body);
            } catch (e) {
                throw new Error("Invalid parameter: " + e.message);
            }
        }

        res.locals.dl.requestInfo.params = filtered;
    }
}
