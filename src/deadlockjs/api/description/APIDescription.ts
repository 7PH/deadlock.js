import {MySQLDescription} from "./MySQLDescription";
import {APIDirectory} from "./APIDirectory";



/** The API description describes the whole API */
export interface APIDescription {
    /** hostname of the API */
    hostname: string;
    /** port */
    port: number;
    db?: {
        mysql?: MySQLDescription;
    },
    /** root directory. as it is an APIDirectory, it can be in a sub-directory, for instance, example.com/api/v0/ */
    root: APIDirectory;
}
