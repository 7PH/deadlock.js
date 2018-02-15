import {RequestHandler} from "express";


export enum APIRouteType {ENDPOINT, DIRECTORY}

export interface APIRoute {
    kind: APIRouteType;
}
export interface APIEndPoint extends APIRoute {
    path: string;
    method: 'get' | 'post' | 'put' | 'delete';
    handler: RequestHandler;
}
export interface APIDirectory extends APIRoute {
    path: string;
    middleware?: RequestHandler | RequestHandler[];
    routes: Array<APIDirectory | APIEndPoint>;
}

export interface APIDescription {
    hostname: string;
    port: number;
    root: APIDirectory;
}
