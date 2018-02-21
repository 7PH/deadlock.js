import {MySQLDescription} from "./MySQLDescription";
import {APIDirectory} from "./APIDirectory";
import {RateLimiterConfig} from "../wrapper/preprocessor/RateLimiter";



/** The API description describes the whole API */
export interface APIDescription {
    /** app secret */
    appSecret: string;

    /** hostname of the API */
    hostname: string;

    /** port */
    port: number;

    /** database */
    db?: {
        mysql?: MySQLDescription;
    };

    /** DDoS */
    rateLimit?: RateLimiterConfig;

    /** root directory. as it is an APIDirectory, it can be in a sub-directory, for instance, example.com/api/v0/ */
    root: APIDirectory;
}
