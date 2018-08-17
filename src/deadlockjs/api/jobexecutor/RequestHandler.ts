import {JobExecutor} from "./JobExecutor";
import {APIEndPoint} from "../../../index";
import * as e from "express";

export class RequestHandler extends JobExecutor {

    protected async execute(endPoint: APIEndPoint, req: e.Request, res: e.Response): Promise<any> {

        const data: any = await endPoint.handler(res.locals.dl);

        res.locals.dl.cacheUpdate = data;

        return data;
    }

}
