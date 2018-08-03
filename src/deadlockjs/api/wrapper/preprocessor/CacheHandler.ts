import {Preprocessor} from "./Preprocessor";
import {APIDescription, APIEndPoint} from "../../../..";
import * as e from "express";
import {PromiseCaching} from "promise-caching";

export class CacheHandler implements Preprocessor {

    private cache: PromiseCaching = new PromiseCaching();

    constructor(private readonly api: APIDescription) { }

    public async preprocess(endPoint: APIEndPoint, req: e.Request, res: e.Response): Promise<void | string> {

        if (typeof this.api.cache !== 'undefined' || typeof endPoint.cache !== 'undefined' )
            return;

        // cache
        let expire: number = (endPoint.cache || this.api.cache || {expire: 1000}).expire;

        // fetch the result
        try {

            return await this.cache.get<string>(endPoint, expire);
        } catch (e) {

            return;
        }
    }

}