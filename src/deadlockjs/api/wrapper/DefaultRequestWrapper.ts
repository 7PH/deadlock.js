import {APIDescription, APIEndPoint} from "../../../";
import * as express from "express";
import * as mysql from "mysql";

export class DefaultRequestWrapper {

    /** MySQL pool */
    private readonly mysqlPool: mysql.Pool;

    /**
     * Build a MySQL connection pool
     * @param {APIDescription} api
     */
    constructor(api: APIDescription) {
        if (api.db) {
            if (api.db.mysql) {
                this.mysqlPool = mysql.createPool(api.db.mysql);
            }
        }
    }

    protected loadParameters(endPoint: APIEndPoint, req: express.Request, res: express.Response): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (endPoint.paramFilter) {
                const filtered: any = endPoint.paramFilter.mask(req.body);
                if (typeof filtered !== 'undefined') {
                    res.locals.params = filtered;
                    resolve();
                } else {
                    reject(new Error("Error parsing parameters. Some are missing or invalid!"));
                }
            } else {
                resolve();
            }
        });
    }

    protected loadDataBase(endPoint: APIEndPoint, req: express.Request, res: express.Response): Promise<void> {
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
                    res.json({error: {message: 'Could not connect to the database'}});
                }
            } else {
                resolve();
            }
        });
    }

    protected unloadDataBase(endPoint: APIEndPoint, req: express.Request, res: express.Response): Promise<void> {
        return new Promise<void>((resolve) => {
            if (endPoint.dbConnection) {
                res.on('close', this.closeMySQLConnection.bind(this, res));
                res.on('finish', this.closeMySQLConnection.bind(this, res));
            }
            resolve();
        });
    }

    /**
     * Wrap every call on an API end-point
     * @param {APIEndPoint} endPoint
     * @param {e.Request} req
     * @param {e.Response} res
     * @param {NextFunction} next
     * @TODO Refactor
     */
    public wrap(endPoint: APIEndPoint, req: express.Request, res: express.Response, next: express.NextFunction): void {
        Promise.all([
            this.loadParameters(endPoint, req, res),
            this.loadDataBase(endPoint, req, res),
            this.unloadDataBase(endPoint, req, res),
        ]).then((value) => {
            console.log("promise return value: ", value);
            endPoint.handler(req, res, next);
        }).catch((reason: Error) => {
            console.log("promise error: ", reason);
            res.json({error: {message: "Request wrapper error: " + reason.message}});
        });
    }

    /**
     * Cleans a database connection
     * @param {express.Response} res
     */
    private closeMySQLConnection(res: express.Response): void {
        const connection: mysql.PoolConnection | undefined = res.locals.mysql;
        if (connection)
            connection.release();
    }
}