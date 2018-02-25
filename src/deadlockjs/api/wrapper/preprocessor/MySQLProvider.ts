import {IPreprocessor} from "./IPreprocessor";
import {APIDescription, APIEndPoint} from "../../../../index";
import * as mysql from "mysql";
import * as express from "express";


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

    public preprocess (endPoint: APIEndPoint, req: express.Request, res: express.Response): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.activated && endPoint.dbConnection) {
                if (this.mysqlPool != null) {
                    this.mysqlPool.getConnection((err: mysql.MysqlError, connection: mysql.PoolConnection) => {
                        if (err) {
                            reject(new Error('Could not allocate MySQL connection'));
                        } else {
                            res.locals.dl.mysql = connection;
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