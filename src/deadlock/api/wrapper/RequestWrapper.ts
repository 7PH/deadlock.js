import {APIDescription, APIEndPoint} from "../../../";
import {Request, Response, NextFunction} from "express";
import {JobExecutor} from "../jobexecutor";
import {RequestBodyChecker} from "../jobexecutor";
import {MySQLCleaner} from "../jobexecutor";
import {MySQLProvider} from "../jobexecutor";
import {IRequestWrapper} from "./IRequestWrapper";
import {RateLimiter} from "../jobexecutor";
import {RequestInitializer} from "../jobexecutor";
import {GateKeeper} from "../jobexecutor";
import {MongoDBProvider} from "../jobexecutor";
import {MongoDBCleaner} from "../jobexecutor";
import {CacheHandler} from "../jobexecutor";
import {RequestHandler} from "../jobexecutor";
import {JobResult} from "../jobexecutor/JobResult";
import {EndPointMiddlewareExecutor} from "../jobexecutor/EndPointMiddlewareExecutor";


type PromiseGenerator<T> = () => Promise<T>;


/**
 * @TODO Implement custom cache keys
 */
export class RequestWrapper implements IRequestWrapper {

    /**
     * Preprocess to do. List of list
     * There will be executed as a series of parallel promises.
     *   example:
     *      p = [[a, b], [c, d]]
     *          a, b will be executed in parallel.
     *          THEN, if all resolves, c and d will be executed in parallel
     * @type {Array<Array<JobExecutor>>}
     */
    public readonly jobs: Array<Array<JobExecutor>> = [];

    /**
     * @param {APIDescription} api
     */
    constructor(private api: APIDescription) {

        /**
         * constraints:
         *  - database cleaner should be executed before database allocators
         */
        this.jobs = [
            [
                new RequestInitializer(api)
            ],
            [
                new GateKeeper(api),
                new RateLimiter(api),
                new CacheHandler(api)
            ],
            [
                new RequestBodyChecker(api),
                new MySQLCleaner(api),
                new MongoDBCleaner(api),
            ],
            [
                new MySQLProvider(api),
                new MongoDBProvider(api),
            ],
            [
                new EndPointMiddlewareExecutor(api)
            ],
            [
                new RequestHandler(api)
            ]
        ];
    }

    /**
     * Get generators out of the job executors and the request parameters
     * @param {APIEndPoint} endPoint
     * @param {e.Request} req
     * @param {e.Response} res
     * @returns {PromiseGenerator<any>[][]}
     */
    private getGenerators(endPoint: APIEndPoint, req: Request, res: Response): PromiseGenerator<JobResult>[][] {
        return this.jobs.map(bunchOfJob =>
                bunchOfJob.map(job =>
                    () =>
                        job.run(endPoint, req, res)
                )
            );
    }

    /**
     * Chain parallel tasks
     * @param {PromiseGenerator<any>[][]} generators
     * @returns {Promise<any>}
     */
    private async chainParallelJobs(generators: PromiseGenerator<any>[][]): Promise<any> {
        // no job to do
        if (generators.length === 0) return Promise.resolve();

        // foreach jobexecutor list
        for (const bunch of generators) {

            // run a bunch of them in parallel
            let results: any[] = await Promise.all(bunch.map(bunch => bunch()));

            // does one of them ask for request termination?
            for (const result of results)
                if (typeof result !== 'undefined' && typeof result.result !== 'undefined')
                    return result;
        }

        return;
    }

    /**
     * Execute job executors as chain of parallel jobs
     * @param {APIEndPoint} endPoint
     * @param {e.Request} req
     * @param {e.Response} res
     * @returns {Promise<any>}
     */
    private executeGenerators(endPoint: APIEndPoint, req: Request, res: Response): Promise<any> {
        return this.chainParallelJobs(this.getGenerators(endPoint, req, res));
    }

    /**
     * Wrap every call on an API end-point
     * @param {APIEndPoint} endPoint
     * @param {e.Request} req
     * @param {e.Response} res
     * @param {NextFunction} next
     */
    public async wrap(endPoint: APIEndPoint, req: Request, res: Response, next: NextFunction) {

        try {
            // run jobs
            let jobResult: JobResult = await this.executeGenerators(endPoint, req, res);

            // convert the result to string
            if (! (jobResult.executor instanceof RequestHandler) && typeof jobResult.result === 'string') {

                res.type('application/json');
                res.send(jobResult.result);
            } else {

                const data: any = JSON.stringify({data: jobResult.result}, this.api.stringify);
                res.type('application/json');
                res.send(data);
            }

        } catch (e) {

            // error occurred during loading or request
            res.status(500);
            res.json({error: {message: e.message, code: 500}});
        }
    }
}
