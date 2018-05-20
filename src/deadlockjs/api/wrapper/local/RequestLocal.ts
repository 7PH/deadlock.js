import {PoolConnection} from "mysql";
import {MongoClient} from "mongodb";
import {Request, Response} from "express";

export interface RequestLocal {

    /** MySQL connection */
    mysql: PoolConnection;

    /** MongoDB connection */
    mongodb: MongoClient;

    /** Deprecated */
    express: {
        req: Request;
        res: Response;
    }

    /** Request info */
    requestInfo: {

        /** IP that made the request */
        ip: string;

        /** Time request was made */
        time: number;

        /** POST param (parsed) */
        params: any;
    };
}
