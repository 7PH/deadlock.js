import {Preprocessor} from "./Preprocessor";
import {APIEndPoint} from "../../../../";
import * as express from "express";
import {PoolConnection} from "mysql";

export class MySQLCleaner implements Preprocessor {

    public async preprocess(endPoint: APIEndPoint, req: express.Request, res: express.Response): Promise<void> {

        if (endPoint.db && endPoint.db.mysql) {

            res.on('close', () => this.closeMySQLConnection(res.locals.dl.mysql));
            res.on('finish', () => this.closeMySQLConnection(res.locals.dl.mysql));
        }
    }

    /**
     * Cleans a database connection
     */
    private closeMySQLConnection(mysql: PoolConnection): void {
        if (mysql)
            mysql.release();
    }

}