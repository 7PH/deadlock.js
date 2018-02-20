import {RequestHandler} from "express";
import {APIRoute} from "./APIRoute";
import {APIEndPoint} from "./APIEndPoint";

/** An API directory is a list of routes, grouped in a sub-directory*/
export interface APIDirectory extends APIRoute {
    /** relative path to the sub-directory */
    path: string;
    /** one middleware or more */
    middleware?: RequestHandler | RequestHandler[];
    /** routes (can be directory themselves ) */
    routes: Array<APIDirectory | APIEndPoint>;
}