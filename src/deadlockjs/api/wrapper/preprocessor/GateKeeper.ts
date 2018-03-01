import {Preprocessor} from "./Preprocessor";
import {APIDescription, APIEndPoint} from "../../../../";
import * as express from "express";

export class GateKeeper implements Preprocessor {

    private readonly blacklist: Array<string> = [];

    public constructor(api: APIDescription) {
        if (api.ipBlacklist != null) {
            this.blacklist = api.ipBlacklist;
        }
    }

    public preprocess(endPoint: APIEndPoint, req: express.Request, res: express.Response): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (this.blacklist.indexOf(req.connection.remoteAddress || '127.0.0.1') !== -1) {
                reject(new Error("You are banned from this server"));
            } else {
                resolve();
            }
        });
    }

}