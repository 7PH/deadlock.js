import {Preprocessor} from "./Preprocessor";
import {APIEndPoint} from "../../../..";
import * as e from "express";
import {APIDescription} from "../../../..";

export class RequestHandler implements Preprocessor {

    constructor(private readonly api: APIDescription) { }

    public async preprocess(endPoint: APIEndPoint, req: e.Request, res: e.Response): Promise<any> {

        const data: any = await endPoint.handler(res.locals.dl);

        res.locals.dl.cacheUpdate = data;

        return data;
    }

}