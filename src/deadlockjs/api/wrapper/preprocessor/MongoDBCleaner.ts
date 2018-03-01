import {Preprocessor} from "./Preprocessor";
import {APIEndPoint} from "../../../../";
import * as express from "express";
import {MongoClient} from "mongodb";

export class MongoDBCleaner implements Preprocessor {
    public preprocess(endPoint: APIEndPoint, req: express.Request, res: express.Response): Promise<void> {
        return new Promise<void>((resolve) => {
            if (endPoint.dbConnection) {
                res.on('close', this.closeMongoDBConnection.bind(this, res));
                res.on('finish', this.closeMongoDBConnection.bind(this, res));
            }
            resolve();
        });
    }

    /**
     * Cleans a database connection
     * @param {express.Response} res
     */
    private closeMongoDBConnection(res: express.Response): void {
        const connection: MongoClient | undefined = res.locals.dl.mongodb;
        if (connection)
            connection.close();
    }

}