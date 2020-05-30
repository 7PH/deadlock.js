import {JobExecutor} from "./JobExecutor";
import {APIEndPoint} from "../../../index";
import * as e from "express";

export class EndPointMiddlewareExecutor extends JobExecutor {

    protected async execute(endPoint: APIEndPoint, req: e.Request, res: e.Response): Promise<any> {

        if (typeof endPoint.middlewares !== 'undefined')
            await Promise.all(endPoint.middlewares.map(middleware => middleware(req, res)));
    }

}
