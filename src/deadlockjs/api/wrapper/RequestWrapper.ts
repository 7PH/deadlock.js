import * as express from "express";
import {APIEndPoint} from "../description/APIEndPoint";

/**
 * A request wrapper encapsulate a route call.
 * It provides basic tools (allocation of a MySQL connection, parameters validation, request caching..
 */
export interface RequestWrapper {
    bindHandler(endPoint: APIEndPoint, req: express.Request, res: express.Response, next: express.NextFunction): void;
}


