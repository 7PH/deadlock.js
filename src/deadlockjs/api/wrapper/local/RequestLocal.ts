import {PoolConnection} from "mysql";
import {MongoClient} from "mongodb";

export interface RequestLocal {
    mysql?: PoolConnection;
    mongodb?: MongoClient;
    params: any;
    ip: string;
}
