import {JobExecutor} from "./JobExecutor";
import {APIDescription, APIEndPoint} from "../../../index";
import * as express from "express";
import {sleep} from "../util/funcs";



/**
 * Configuration object
 */
export interface RateLimiterConfig {
    ipWhitelist: Array<string>;
    maxWeightPerSec: number;
    maxPending: number;
    weight: number;
}

/**
 * Override configuration per api endpoint
 */
export interface RateLimiterConfigOverride {
    weight?: number;
    enabled?: boolean;
}

/**
 * The RateLimiter limits the number of requests which can be made to the API
 */
export class RateLimiter extends JobExecutor {

    /**
     * Default RateLimiter configuration
     */
    public static readonly DEFAULT_CONFIG: RateLimiterConfig = {

        ipWhitelist: [],

        weight: 4,

        maxWeightPerSec: 1,

        maxPending: 1
    };

    /**
     * Configuration
     */
    public readonly config: RateLimiterConfig;

    /**
     * Whether the RateLimiter is activated
     */
    public readonly activated: boolean;

    /**
     * Clients
     * @type {Map<any, any>}
     */
    public readonly clients: Map<string, {weight: number, pending: number}> = new Map();

    /**
     * Creates a new RateLimiter in charge of one application
     * @param {APIDescription} api
     */
    constructor (api: APIDescription) {
        super(api);

        this.config = api.rateLimit || RateLimiter.DEFAULT_CONFIG;
        this.activated = api.rateLimit != null;
        setInterval(this.clean.bind(this), 1000);
    }

    /**
     * Removes weight for everyone
     */
    private clean(): void {
        this.clients.forEach((data: {weight: number, pending: number}, ip: string) => {
            // gives weight to client
            data.weight = Math.max(0, data.weight - this.config.maxWeightPerSec);
            // removes the ip if user stop doing requests for a while
            if (data.weight === 0 && data.pending === 0)
                this.clients.delete(ip);
        });
    }

    /**
     * Retrieve user information. Creates his data object if it is not set
     * @param {e.Request} req
     */
    private getClientData(req: express.Request): {weight: number, pending: number} {
        const ip: string = req.connection.remoteAddress || '127.0.0.1';
        let data: {weight: number, pending: number} | undefined = this.clients.get(ip);
        if (data == null) {
            data = {weight: 0, pending: 0};
            this.clients.set(ip, data);
        }
        return data;
    }

    /**
     * Preprocess a new incoming request
     * @param {APIEndPoint} endPoint
     * @param {e.Request} req
     * @param {e.Response} res
     * @returns {Promise<void>}
     */
    public async execute (endPoint: APIEndPoint, req: express.Request, res: express.Response): Promise<void> {

        // the module is not activated
        if (! this.activated) return;

        // the rate limit is not defined for this route
        if (endPoint.rateLimit != null && endPoint.rateLimit.enabled == false) return;

        // the ip is whitelisted
        if (this.config.ipWhitelist.indexOf(req.connection.remoteAddress || '127.0.0.1') != -1) return;

        // merge route configuration
        let config: any = this.config;
        if (endPoint.rateLimit)
            for (let prop in endPoint.rateLimit)
                if (typeof config[prop] !== 'undefined')
                    config[prop] = (endPoint.rateLimit as any)[prop];

        // get user data
        const data: {weight: number, pending: number} = this.getClientData(req);

        // user makes too many requests
        if (data.weight > this.config.maxWeightPerSec) {

            // user makes too many requests + too many are pending....
            if (data.pending >= this.config.maxPending)
                throw new Error("Too many requests");

            // user makes too many requests with a few pending
            // will enter waiting loop
            ++ data.pending;
            while (true) {
                await sleep(500);

                if (data.weight < this.config.maxWeightPerSec) {

                    // at least we can resolve the promise
                    -- data.pending;
                    data.weight += this.config.weight;
                    break;
                }
            }
        }

        data.weight += this.config.weight;
    }

}
