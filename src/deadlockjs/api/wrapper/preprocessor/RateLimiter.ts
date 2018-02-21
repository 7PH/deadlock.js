import {IPreprocessor} from "./IPreprocessor";
import {APIDescription, APIEndPoint} from "../../../../";
import * as express from "express";
import Timer = NodeJS.Timer;



/**
 * Configuration object
 */
export interface RateLimiterConfig {
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
export class RateLimiter implements IPreprocessor {

    /**
     * Default RateLimiter configuration
     * @type {{defaultAction: RateLimiterAction; weight: number; maxWeightPerSec: number}}
     */
    public static readonly DEFAULT_CONFIG: RateLimiterConfig = {
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
        const ip: string = req.connection.remoteAddress || '';
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
    public preprocess (endPoint: APIEndPoint, req: express.Request, res: express.Response): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (! this.activated) return resolve();
            if (endPoint.rateLimit != null && endPoint.rateLimit.enabled == false) resolve();

            // merge configurations
            let config: any = this.config;
            if (endPoint.rateLimit) {
                for (let prop in endPoint.rateLimit) {
                    if (typeof config[prop] !== 'undefined')
                        config[prop] = (endPoint.rateLimit as any)[prop];
                }
            }

            // get user data
            const data: {weight: number, pending: number} = this.getClientData(req);

            if (data.weight > this.config.maxWeightPerSec) {
                // user makes too many requests
                if (data.pending >= this.config.maxPending) {
                    // user makes too many requests + too many are pending....
                    reject(new Error("Too many requests"));
                } else {
                    // user makes too many requests with a few pending
                    ++ data.pending;
                    let i: Timer = setInterval(() => {
                        if (data.weight < this.config.maxWeightPerSec) {
                            -- data.pending;
                            clearInterval(i);
                            data.weight += this.config.weight;
                            resolve();
                        }
                    }, 500);
                }
            } else {
                data.weight += this.config.weight;
                resolve();
            }
        });
    }

}