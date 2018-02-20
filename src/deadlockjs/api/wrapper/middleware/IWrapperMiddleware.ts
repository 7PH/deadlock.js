import * as express from "express";
import {APIEndPoint} from "../../../../";

/**
 * A task which has to be done before calling the RequestHandler
 *  e.g. loading mysql connection,
 */

export interface IWrapperMiddleware {
    middleware (endPoint: APIEndPoint, req: express.Request, res: express.Response): Promise<any>;
}