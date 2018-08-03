import {MySQLConfig} from "./MySQLConfig";
import {APIDirectory} from "./APIDirectory";
import {RateLimiterConfig} from "../../../";
import * as multer from "multer";
import * as cors from "cors";


/** The API description describes the whole API */
export interface APIDescription {
    /** app secret */
    appSecret: string;

    /** cors options */
    cors?: cors.CorsOptions;

    ssl?: {
        cert: Buffer;
        key: Buffer;
    }

    /** path to static files */
    static?: string;

    /** amount of workers */
    workers: number;

    /** ip blacklist */
    ipBlacklist?: Array<string>;

    /** favicon */
    favicon?: string;

    /** port */
    port: number;

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

    /** root directory. as it is an APIDirectory, it can be in a sub-directory, for instance, example.com/api/v0/ */
    root: APIDirectory;
}
