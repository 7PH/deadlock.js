import {IPreprocessor} from "./IPreprocessor";
import {APIEndPoint} from "../../../../";
import * as express from "express";
import * as mysql from "promise-mysql";

export class MySQLCleaner implements IPreprocessor {
    public preprocess(endPoint: APIEndPoint, req: express.Request, res: express.Response): Promise<void> {
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
        const connection: mysql.PoolConnection | undefined = res.locals.dl.mysql;
        if (connection)
            connection.release();
    }

}