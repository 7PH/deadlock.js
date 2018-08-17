import * as iof from "io-filter";
import {APIEndPointHandler} from "./APIEndPointHandler";
import {APIMiddleware} from "./APIMiddleware";
import {RateLimiterConfigOverride} from "../jobexecutor";
import {Request, Response} from "express";

/**
 * Acceptable method
 */
export type HTTPMethod = 'get' | 'post' | 'put' | 'delete';

/** An API end-point is an application entry point */
export interface APIEndPoint {

    /** method to use */
    method?: HTTPMethod | HTTPMethod[];

    /** will handle the request */
    handler: APIEndPointHandler;

    /** custom jobs */
    middlewares?: APIMiddleware[];

    /** if you want to ensure request body is filled with valid data, use a valid MaskFilter here */
    paramFilter?: iof.MaskFilter,

    /** caching */
    cache?: {
        /** expire time in milliseconds */
        expire: number;
        /** custom cache keyGen generator */
        key?: (req: Request, res: Response) => any;
    };

    /** ddos protection configuration override @TODO implement */
    rateLimit?: RateLimiterConfigOverride;

    /** wether this end-point needs database allocation (an instance of mysql) */
    db?: {
        mysql?: boolean;
        mongodb?: boolean;
    };
}
