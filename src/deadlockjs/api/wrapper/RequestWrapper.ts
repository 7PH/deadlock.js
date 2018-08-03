import {APIDescription, APIEndPoint, RequestLocal} from "../../../";
import {Request, Response, NextFunction} from "express";
import {JobExecutor} from "../jobexecutor/JobExecutor";
import {RequestBodyChecker} from "../jobexecutor/RequestBodyChecker";
import {MySQLCleaner} from "../jobexecutor/MySQLCleaner";
import {MySQLProvider} from "../jobexecutor/MySQLProvider";
import {IRequestWrapper} from "./IRequestWrapper";
import {RateLimiter} from "../jobexecutor/RateLimiter";
import {RequestInitializer} from "../jobexecutor/RequestInitializer";
import {GateKeeper} from "../jobexecutor/GateKeeper";
import {MongoDBProvider} from "../jobexecutor/MongoDBProvider";
import {MongoDBCleaner} from "../jobexecutor/MongoDBCleaner";
import {CacheHandler} from "../jobexecutor/CacheHandler";
import {RequestHandler} from "../jobexecutor/RequestHandler";


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
     * @param cache
     * @param {APIDescription} api
     */
    constructor(private api: APIDescription) {

        /**
         * constraints:
         *  - database cleaner should be executed before database allocators
         */
        this.jobs = [
            [
                new RequestInitializer()
            ],
            [
                new GateKeeper(api),
                new RateLimiter(api),
                new CacheHandler(api)
            ],
            [
                new RequestBodyChecker(),
                new MySQLCleaner(),
                new MongoDBCleaner(),
            ],
            [
                new MySQLProvider(api),
                new MongoDBProvider(api),
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
    private getGenerators(endPoint: APIEndPoint, req: Request, res: Response): PromiseGenerator<any>[][] {
        return this.jobs.map(bunchOfJob =>
                bunchOfJob.map(job =>
                    () =>
                        job.preprocess(endPoint, req, res)
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

            // execute a bunch of them in parallel
            let results: any[] = await Promise.all(bunch.map(bunch => bunch()));

            // does one of them ask for request termination?
            for (const result of results)
                if (typeof result !== 'undefined')
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
            // execute jobs
            let result: any = await this.executeGenerators(endPoint, req, res);

            // custom middle
            if (typeof endPoint.middlewares !== 'undefined')
                await Promise.all(endPoint.middlewares.map(middleware => middleware(req, res)));

            // meaning that one of the jobexecutor wanted to terminate the request
            if (typeof result !== 'undefined') {

                const data: string = typeof result === 'string' ? result : JSON.stringify({data: result});
                res.type('application/json');
                res.send(data);
                return;
            }
            
            // not supposed to happen because the last jobexecutor always return a value
            throw new Error("Unexpected end of file");
        } catch (e) {

            // error occurred during loading or request
            res.status(500);
            res.json({error: {message: e.message, code: 500}});
        }
    }
}