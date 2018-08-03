import {Preprocessor} from "./Preprocessor";
import {APIEndPoint} from "../../../../";
import * as express from "express";
import {MongoClient} from "mongodb";

export class MongoDBCleaner implements Preprocessor {

    /**
     *
     */
    private mongodb: MongoClient;

    /**
     *
     * @param endPoint
     * @param req
     * @param res
     */
    public async preprocess(endPoint: APIEndPoint, req: express.Request, res: express.Response): Promise<void> {

        if (endPoint.db && endPoint.db.mongodb) {
            this.mongodb = res.locals.dl.mongodb;
            res.on('close', async () => this.close());
            res.on('finish', async () => this.close());
        }
    }

    /**
     * Cleans a database connection
     */
    private async close(): Promise<void> {
        if (this.mongodb)
            await this.mongodb.close();
    }

}