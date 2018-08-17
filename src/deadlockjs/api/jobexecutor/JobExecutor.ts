import * as express from "express";
import {APIDescription, APIEndPoint} from "../../../index";
import {JobResult} from "./JobResult";

/**
 * A task which has to be done before calling the RequestHandler
 *  e.g. loading mysql connection,
 */

export abstract class JobExecutor {

    /**
     *
     * @param {APIDescription} api
     */
    constructor(protected readonly api: APIDescription) { }

    /**
     *
     * @param {APIEndPoint} endPoint
     * @param {e.Request} req
     * @param {e.Response} res
     * @returns {Promise<void | any>}
     */
    protected abstract execute (endPoint: APIEndPoint, req: express.Request, res: express.Response): Promise<void | any>;

    /**
     *
     * @param {APIEndPoint} endPoint
     * @param {e.Request} req
     * @param {e.Response} res
     * @returns {Promise<any>}
     */
    public async run(endPoint: APIEndPoint, req: express.Request, res: express.Response): Promise<JobResult> {

        return {

            executor: this,

            result: await this.execute(endPoint, req, res)
        }
    }
}
