import {JobExecutor} from "./JobExecutor";
import {APIEndPoint} from "../../../index";
import * as express from "express";
import {MongoClient} from "mongodb";

export class MongoDBCleaner implements JobExecutor {

    /**
     *
     * @param endPoint
     * @param req
     * @param res
     */
    public async preprocess(endPoint: APIEndPoint, req: express.Request, res: express.Response): Promise<void> {

        if (endPoint.db && endPoint.db.mongodb) {
            res.on('close', async () => this.close(res.locals.dl.mongodb));
            res.on('finish', async () => this.close(res.locals.dl.mongodb));
        }
    }

    /**
     * Cleans a database connection
     */
    private async close(mongodb: MongoClient): Promise<void> {
        if (mongodb)
            await mongodb.close();
    }

}