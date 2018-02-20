import {IWrapperMiddleware} from "./IWrapperMiddleware";
import {APIEndPoint} from "../../../../";
import * as express from "express";
import * as mysql from "mysql";

export class DBConnectionCleaner implements IWrapperMiddleware {
    middleware(endPoint: APIEndPoint, req: express.Request, res: express.Response): Promise<void> {
        return new Promise<void>((resolve) => {
            if (endPoint.dbConnection) {
                res.on('close', this.closeMySQLConnection.bind(this, res));
                res.on('finish', this.closeMySQLConnection.bind(this, res));
            }
            resolve();
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