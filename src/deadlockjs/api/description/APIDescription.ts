import {MySQLConfig} from "./MySQLConfig";
import {APIDirectory} from "./APIDirectory";
import {RateLimiterConfig} from "../wrapper/preprocessor/RateLimiter";


/** The API description describes the whole API */
export interface APIDescription {
    /** app secret */
    appSecret: string;

    /** amount of workers */
    workers: number;

    /** ip blacklist */
    ipBlacklist?: Array<string>;

    /** favicon */
    favicon?: string;

    /** port */
    port: number;

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
