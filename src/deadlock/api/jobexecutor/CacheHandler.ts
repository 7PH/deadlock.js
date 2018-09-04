import {JobExecutor} from "./JobExecutor";
import {APIEndPoint, RequestLocal} from "../../../index";
import * as e from "express";
import {PromiseCaching} from "promise-caching";

export class CacheHandler extends JobExecutor {

    private cache: PromiseCaching = new PromiseCaching({returnExpired: false});

    public async execute(endPoint: APIEndPoint, req: e.Request, res: e.Response): Promise<void | string> {

        // cache enabled?
        if (typeof this.api.cache === 'undefined' && typeof endPoint.cache === 'undefined' )
            return;

        // cache keyGen
        let cacheKey: any;
        if (typeof endPoint.cache === 'undefined' || typeof endPoint.cache.key == 'undefined')
            cacheKey = endPoint;
        else
            cacheKey = endPoint.cache.key(req, res);

        // cache expiration
        let expire: number = (endPoint.cache || this.api.cache || {expire: 1000}).expire;

        // bind cache storage listener
        res.on('close', () => this.updateCache(endPoint, cacheKey, expire, res.locals.dl));
        res.on('finish', () => this.updateCache(endPoint, cacheKey, expire, res.locals.dl));

        // fetch the result
        try {

            return await this.cache.get<string>(cacheKey, expire);
        } catch (e) {

            return;
        }
    }

    /**
     *
     * @param endPoint
     * @param cacheKey
     * @param expire
     * @param dl
     */
    public updateCache(endPoint: APIEndPoint, cacheKey: any, expire: number, dl: RequestLocal): void {

        if (typeof dl.cacheUpdate !== "undefined") {

            let cache: string;
            if (typeof dl.cacheUpdate !== 'string')
                cache = JSON.stringify({ data: dl.cacheUpdate }, this.api.stringify);
            else
                cache = dl.cacheUpdate;

            this.cache.store<string>(cacheKey, expire, cache);
        }
    }

}
