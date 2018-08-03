import {JobExecutor} from "./JobExecutor";
import {APIEndPoint} from "../../../index";
import * as e from "express";
import {APIDescription} from "../../../index";

export class RequestHandler implements JobExecutor {

    constructor(private readonly api: APIDescription) { }

    public async preprocess(endPoint: APIEndPoint, req: e.Request, res: e.Response): Promise<any> {

        const data: any = await endPoint.handler(res.locals.dl);

        res.locals.dl.cacheUpdate = data;

        return data;
    }

}