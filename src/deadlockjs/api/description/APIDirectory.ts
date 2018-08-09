import {APIEndPoint} from "./APIEndPoint";
import {APIMiddleware} from "./APIMiddleware";
import {APIEndPointHandler} from "./APIEndPointHandler";

/** An API directory is a list of routes, grouped in a sub-directory*/
export interface APIDirectory {

    /** one jobexecutor or more */
    middleware?: APIMiddleware[];

    /** routes (can be directory themselves ) */
    routes: {[path: string]: APIDirectory | APIEndPoint | APIEndPointHandler};
}
