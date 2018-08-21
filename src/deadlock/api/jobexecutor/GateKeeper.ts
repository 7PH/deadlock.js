import {JobExecutor} from "./JobExecutor";
import {APIDescription, APIEndPoint} from "../../../index";
import * as express from "express";

export class GateKeeper extends JobExecutor {

    private readonly blacklist: Array<string> = [];

    public constructor(api: APIDescription) {
        super(api);

        if (api.ipBlacklist != null) {
            this.blacklist = api.ipBlacklist;
        }
    }

    public async execute(endPoint: APIEndPoint, req: express.Request, res: express.Response): Promise<void> {

        if (this.blacklist.indexOf(req.connection.remoteAddress || '127.0.0.1') !== -1)
            throw new Error("You are banned from this server");
    }

}
