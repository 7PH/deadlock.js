import {APIEndPoint} from "./APIEndPoint";
import {APIMiddleware} from "./APIMiddleware";

/** An API directory is a list of routes, grouped in a sub-directory*/
export interface APIDirectory {

    /** relative path to the sub-directory */
    path: string;

    /** one jobexecutor or more */
    middleware?: APIMiddleware[];

    /** routes (can be directory themselves ) */
    routes: (APIDirectory | APIEndPoint)[];
}