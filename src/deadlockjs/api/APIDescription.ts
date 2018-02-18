import {RequestHandler} from "express";
import {PoolConfig} from "mysql";

/** API route type */
export enum APIRouteType {ENDPOINT, DIRECTORY}

/** An API route */
export interface APIRoute {
    kind: APIRouteType;
}

/**
 * MySQL info
 */
export interface MySQLDescription extends PoolConfig { }

/** An API end-point is an application entry point */
export interface APIEndPoint extends APIRoute {
    /** relative path of this end-point */
    path: string;
    /** method to use */
    method: 'get' | 'post' | 'put' | 'delete';
    /** will handle the request */
    handler: RequestHandler;
    /** wether this end-point needs database allocation (an instance of mysql) */
    dbConnection: boolean;
}

/** An API directory is a list of routes, grouped in a sub-directory*/
export interface APIDirectory extends APIRoute {
    /** relative path to the sub-directory */
    path: string;
    /** one middleware or more */
    middleware?: RequestHandler | RequestHandler[];
    /** routes (can be directory themselves ) */
    routes: Array<APIDirectory | APIEndPoint>;
}

/** The API description describes the whole API */
export interface APIDescription {
    /** hostname of the API */
    hostname: string;
    /** port */
    port: number;
    db?: {
        mysql?: MySQLDescription;
    },
    /** root directory. as it is an APIDirectory, it can be in a sub-directory, for instance, example.com/api/v0/ */
    root: APIDirectory;
}
