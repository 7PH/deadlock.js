import * as iof from "io-filter";
import * as express from "express";
import {APIRoute} from "./APIRoute";
import {RateLimiterConfigOverride} from "../wrapper/preprocessor/RateLimiter";
import {APIRouteType} from "./APIRouteType";
import {Request, Response} from "express-serve-static-core";

/** An API end-point is an application entry point */
export interface APIEndPoint extends APIRoute {
    kind: APIRouteType.END_POINT;

    /** relative path of this end-point */
    path: string;

    /** method to use */
    method: 'get' | 'post' | 'put' | 'delete';

    /** will handle the request */
    handler: (req: Request, res: Response) => any;

    /** if you want to ensure request body is filled with valid data, use a valid MaskFilter here */
    paramFilter?: iof.MaskFilter,

    /** caching @TODO implement */
    cache?: {
        /** identifier function (by default, IP address) */
        identifier?: (req: express.Request, res: express.Response) => string,
        /** expire time */
        timeout: number;
    };

    /** ddos protection configuration override @TODO implement */
    rateLimit?: RateLimiterConfigOverride;

    /** wether this end-point needs database allocation (an instance of mysql) */
    dbConnection?: boolean;
}