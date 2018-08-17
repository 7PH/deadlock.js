import {MySQLConfig} from "./MySQLConfig";
import {APIDirectory} from "./APIDirectory";
import {RateLimiterConfig} from "../../../";
import * as multer from "multer";
import * as cors from "cors";
import * as morgan from "morgan";
import {Options} from "morgan";


/** The API description describes the whole API */
export interface APIDescription extends APIDirectory {
    /** app secret */
    appSecret?: string;

    cors?: cors.CorsOptions;

    logger?: {
        format: string;
        options: morgan.Options
    };

    cookies?: boolean;

    verbose?: boolean;

    ssl?: {
        cert: Buffer;
        key: Buffer;
    }

    /** path to static files */
    static?: string;

    /** amount of workers */
    workers?: number;

    /** ip blacklist */
    ipBlacklist?: Array<string>;

    /** favicon */
    favicon?: string;

    /** port */
    port?: number;

    /** host name */
    hostname?: string;

    /** whether allow global upload */
    globalUpload?: multer.Options;

    /** database */
    db?: {
        mysql?: MySQLConfig;
        mongodb?: { url: string; };
    };

    /** DDoS */
    rateLimit?: RateLimiterConfig;

    /** Cache system */
    cache?: {
        expire: number;
    };

    /** base path of the api */
    basePath?: string;
}
