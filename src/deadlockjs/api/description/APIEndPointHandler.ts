import {RequestLocal} from "../../..";

export interface APIEndPointHandler {
    (dl: RequestLocal): Promise<any>;
}