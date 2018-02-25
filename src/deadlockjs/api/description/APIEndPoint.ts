import * as iof from "io-filter";
import * as express from "express";
import {APIRoute} from "./APIRoute";
import {RateLimiterConfigOverride} from "../wrapper/preprocessor/RateLimiter";
import {APIRouteType} from "./APIRouteType";
import {APIEndPointHandler} from "./APIEndPointHandler";

/** An API end-point is an application entry point */
export interface APIEndPoint extends APIRoute {
    kind: APIRouteType.END_POINT;

    /** relative path of this end-point */
    path: string;

    /** method to use */
    method: 'get' | 'post' | 'put' | 'delete';

    /** will handle the request */
    handler: APIEndPointHandler;

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
    dbConnection?: boolean;
}