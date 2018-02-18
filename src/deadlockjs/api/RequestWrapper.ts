import {APIEndPoint, MySQLDescription} from "./APIDescription";
import * as express from "express";
import {NextFunction} from "express-serve-static-core";
import * as mysql from "mysql";


export interface RequestWrapper {
    bindHandler(endPoint: APIEndPoint, req: express.Request, res: express.Response, next: NextFunction): void;
}

export class SimpleRequestWrapper implements RequestWrapper {
    public bindHandler(endPoint: APIEndPoint, req: express.Request, res: express.Response, next: NextFunction): void {
        endPoint.handler(req, res, next);
    }
}

export class MySQLRequestWrapper extends SimpleRequestWrapper {

    /** MySQL pool */
    private readonly mysqlPool: mysql.Pool;

    /**
     * Build a MySQL connection pool
     * @param {MySQLDescription} mysqlDescription
     */
    constructor(mysqlDescription: MySQLDescription) {
        super();

        this.mysqlPool = mysql.createPool(mysqlDescription);
        console.log(mysqlDescription, this.mysqlPool);
    }

    /**
     * Wrap every call on an API end-point
     * @param {APIEndPoint} endPoint
     * @param {e.Request} req
     * @param {e.Response} res
     * @param {NextFunction} next
     */
    public bindHandler(endPoint: APIEndPoint, req: express.Request, res: express.Response, next: NextFunction): void {
        if (endPoint.dbConnection) {
            this.mysqlPool.getConnection((err: mysql.MysqlError, connection: mysql.PoolConnection) => {
                if (err) {
                    // could not get the mysql connection !?
                    res.json({error: {message: 'Could not allocate MySQL connection', cause: err.toString()}});
                } else {
                    res.locals.mysql = connection;
                    super.bindHandler(endPoint, req, res, next);
                }

                if (connection) {
                    res.on('close', this.closeMysqlConnection.bind(this, connection));
                    res.on('finish', this.closeMysqlConnection.bind(this, connection));
                }
            });
        } else {
            super.bindHandler(endPoint, req, res, next);
        }
    }

    /**
     * Cleans a database connection
     * @param {PoolConnection} connection
     */
    private closeMysqlConnection(connection: mysql.PoolConnection): void {
        if (connection)
            connection.release();
    }
}