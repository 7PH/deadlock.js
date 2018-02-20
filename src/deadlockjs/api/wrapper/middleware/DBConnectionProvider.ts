import {IWrapperMiddleware} from "./IWrapperMiddleware";
import {APIDescription, APIEndPoint} from "../../../../index";
import * as mysql from "mysql";
import * as express from "express";


export class DBConnectionProvider implements IWrapperMiddleware {

    private readonly mysqlPool: mysql.Pool;

    constructor(api: APIDescription) {
        if (api.db) {
            if (api.db.mysql) {
                this.mysqlPool = mysql.createPool(api.db.mysql);
            }
        }
    }

    middleware (endPoint: APIEndPoint, req: express.Request, res: express.Response): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (endPoint.dbConnection) {
                if (this.mysqlPool != null) {
                    this.mysqlPool.getConnection((err: mysql.MysqlError, connection: mysql.PoolConnection) => {
                        if (err) {
                            reject(new Error('Could not allocate MySQL connection'));
                        } else {
                            res.locals.mysql = connection;
                            resolve();
                        }
                    });
                } else {
                    reject(new Error('Could not connect to the database'));
                }
            } else {
                resolve();
            }
        });
    }

}