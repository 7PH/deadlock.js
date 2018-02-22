import {PoolConnection} from "mysql";

export interface RequestLocal {
    mysql?: PoolConnection;
    params: any;
}
