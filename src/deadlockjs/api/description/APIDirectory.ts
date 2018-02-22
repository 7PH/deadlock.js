import {RequestHandler} from "express";
import {APIRoute} from "./APIRoute";
import {APIEndPoint} from "./APIEndPoint";
import {APIRouteType} from "./APIRouteType";

/** An API directory is a list of routes, grouped in a sub-directory*/
export interface APIDirectory extends APIRoute {
    kind: APIRouteType.DIRECTORY;
    /** relative path to the sub-directory */
    path: string;
    /** one preprocessor or more */
    middleware?: RequestHandler | RequestHandler[];
    /** routes (can be directory themselves ) */
    routes: (APIDirectory | APIEndPoint)[];
}