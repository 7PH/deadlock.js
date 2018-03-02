import {Preprocessor} from "./Preprocessor";
import {APIDescription, APIEndPoint} from "../../../../index";
import * as mysql from "mysql";
import * as express from "express";


export class MySQLProvider implements Preprocessor {

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
        return new Promise<void>((resolve, reject) => {
            if (this.activated && endPoint.db && endPoint.db.mysql) {
                if (this.mysqlPool != null) {
                    this.mysqlPool.getConnection((err, conn) => {
                        if (err) return reject(new Error('Could not allocate MySQL connection'));
                        else {
                            res.locals.dl.mysql = conn;
                            return resolve();
                        }
                    });
                } else {
                    return reject(new Error('Could not connect to the database'));
                }
            } else {
                return resolve();
            }
        })
    }

}