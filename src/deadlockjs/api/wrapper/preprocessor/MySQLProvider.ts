import {IPreprocessor} from "./IPreprocessor";
import {APIDescription, APIEndPoint} from "../../../../index";
import * as mysql from "promise-mysql";
import * as express from "express";
import {PoolConnection} from "promise-mysql";


export class MySQLProvider implements IPreprocessor {

    private readonly mysqlPool: mysql.Pool;

    private readonly activated: boolean = false;

    constructor(api: APIDescription) {
        if (api.db) {
            if (api.db.mysql) {
                this.activated = true;
                this.mysqlPool = mysql.createPool(api.db.mysql);
            }
        }
    }

    public async preprocess (endPoint: APIEndPoint, req: express.Request, res: express.Response): Promise<void> {
        if (this.activated && endPoint.dbConnection) {
            if (this.mysqlPool != null) {
                try {
                    res.locals.dl.mysql = await this.mysqlPool.getConnection();
                } catch (e) {
                    throw new Error('Could not allocate MySQL connection');
                }
            } else {
                throw new Error('Could not connect to the database');
            }
        }
    }

}