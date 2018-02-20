import {RequestHandler} from "express";
import * as iof from "io-filter";
import * as express from "express";
import {APIRoute} from "./APIRoute";

/** An API end-point is an application entry point */
export interface APIEndPoint extends APIRoute {
    /** relative path of this end-point */
    path: string;

    /** method to use */
    method: 'get' | 'post' | 'put' | 'delete';

    /** will handle the request */
    handler: RequestHandler;

    /** if you want to ensure request body is filled with valid data, use a valid MaskFilter here */
    paramFilter?: iof.MaskFilter,

    /** caching @TODO implement */
    cache?: {
        /** identifier function (by default, IP address) */
        identifier?: (req: express.Request, res: express.Response) => string,
        /** expire time */
        timeout: number;
    };

    /** wether this end-point needs database allocation (an instance of mysql) */
    dbConnection: boolean;
}