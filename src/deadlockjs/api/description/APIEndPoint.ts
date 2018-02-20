import {RequestHandler} from "express";
import * as iof from "io-filter";
import {APIRoute} from "./APIRoute";

/** An API end-point is an application entry point */
export interface APIEndPoint extends APIRoute {
    /** relative path of this end-point */
    path: string;
    /** method to use */
    method: 'get' | 'post' | 'put' | 'delete';
    /** will handle the request */
    handler: RequestHandler;
    /** parameters */
    paramFilter?: iof.MaskFilter,
    /** wether this end-point needs database allocation (an instance of mysql) */
    dbConnection: boolean;
}