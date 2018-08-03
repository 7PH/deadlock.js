import {JobExecutor} from "./JobExecutor";
import {APIEndPoint} from "../../../index";
import * as express from "express";

export class RequestBodyChecker implements JobExecutor {

    public async preprocess (endPoint: APIEndPoint, req: express.Request, res: express.Response): Promise<void> {

        let filtered: any = {};

        if (endPoint.paramFilter) {

            filtered = endPoint.paramFilter.mask(req.body);

            if (typeof filtered === 'undefined')
                throw new Error("Error parsing parameters. Some are missing or invalid!");
        }

        res.locals.dl.requestInfo.params = filtered;
    }
}