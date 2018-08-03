import {Preprocessor} from "./Preprocessor";
import {APIEndPoint} from "../../../../";
import * as express from "express";
import {PoolConnection} from "mysql";

export class MySQLCleaner implements Preprocessor {

    private mysql: PoolConnection;

    public async preprocess(endPoint: APIEndPoint, req: express.Request, res: express.Response): Promise<void> {

        if (endPoint.db && endPoint.db.mysql) {

            this.mysql = res.locals.dl.mysql;
            res.on('close', () => this.closeMySQLConnection());
            res.on('finish', () => this.closeMySQLConnection());
        }
    }

    /**
     * Cleans a database connection
     */
    private closeMySQLConnection(): void {
        if (this.mysql)
            this.mysql.release();
    }

}