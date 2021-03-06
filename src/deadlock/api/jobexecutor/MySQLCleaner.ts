import {JobExecutor} from "./JobExecutor";
import {APIEndPoint} from "../../../index";
import * as express from "express";
import {PoolConnection} from "mysql";

export class MySQLCleaner extends JobExecutor {

    public async execute(endPoint: APIEndPoint, req: express.Request, res: express.Response): Promise<void> {

        if (endPoint.db && endPoint.db.mysql) {

            res.on('close', () => this.closeMySQLConnection(res.locals.dl.mysql));
            res.on('finish', () => this.closeMySQLConnection(res.locals.dl.mysql));
        }
    }

    /**
     * Cleans a database connection
     */
    private closeMySQLConnection(mysql: PoolConnection): void {
        if (mysql) {
            try {
                mysql.release();
            } catch (e) { }
        }
    }

}
