import * as iof from "io-filter";
import {RateLimiterConfigOverride} from "../../..";
import {APIEndPointHandler} from "./APIEndPointHandler";
import {APIMiddleware} from "./APIMiddleware";

/** An API end-point is an application entry point */
export interface APIEndPoint {

    /** relative path of this end-point */
    path?: string;

    /** method to use */
    method: 'get' | 'post' | 'put' | 'delete';

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
    };

    /** ddos protection configuration override @TODO implement */
    rateLimit?: RateLimiterConfigOverride;

    /** wether this end-point needs database allocation (an instance of mysql) */
    db?: {
        mysql?: boolean;
        mongodb?: boolean;
    };
}