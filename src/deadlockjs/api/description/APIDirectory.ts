import {APIRoute} from "./APIRoute";
import {APIEndPoint} from "./APIEndPoint";
import {APIMiddleware} from "./APIMiddleware";

/** An API directory is a list of routes, grouped in a sub-directory*/
export interface APIDirectory extends APIRoute {

    kind: 'directory';

    /** relative path to the sub-directory */
    path: string;

    /** one preprocessor or more */
    middleware?: APIMiddleware[];

    /** routes (can be directory themselves ) */
    routes: (APIDirectory | APIEndPoint)[];
}