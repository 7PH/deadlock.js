import {APIDescription, APIEndPoint, RequestLocal} from "../../../";
import * as express from "express";
import {Preprocessor} from "./preprocessor/Preprocessor";
import {RequestBodyChecker} from "./preprocessor/RequestBodyChecker";
import {MySQLCleaner} from "./preprocessor/MySQLCleaner";
import {MySQLProvider} from "./preprocessor/MySQLProvider";
import {IRequestWrapper} from "./IRequestWrapper";
import {RateLimiter} from "./preprocessor/RateLimiter";
import {RequestInitializer} from "./preprocessor/RequestInitializer";
import {GateKeeper} from "./preprocessor/GateKeeper";
import {PromiseCaching} from "promise-caching";
import {MongoDBProvider} from "./preprocessor/MongoDBProvider";
import {MongoDBCleaner} from "./preprocessor/MongoDBCleaner";
import {CacheHandler} from "./preprocessor/CacheHandler";
import {RequestHandler} from "./preprocessor/RequestHandler";


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
     * @type {Array<Array<Preprocessor>>}
     */
    public readonly preprocessors: Array<Array<Preprocessor>> = [];

    /**
     * @param cache
     * @param {APIDescription} api
     */
    constructor(private api: APIDescription) {

        /**
         * constraints:
         *  - database cleaner should be executed before database allocators
         */
        this.preprocessors = [
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

    private async chainParallelPromises(jobs: PromiseGenerator<any>[][]): Promise<any> {
        // no job to do
        if (jobs.length === 0) return Promise.resolve();

        // foreach preprocessor list
        for (const job of jobs) {

            // execute a bunch of them in parallel
            let results: any[] = await Promise.all(job.map(j => j()));

            // does one of them ask for request termination?
            for (const result of results)
                if (typeof result !== 'undefined')
                    return result;
        }

        return;
    }

    private preprocessorsToPromiseGenerator(preprocessors: Preprocessor[], endPoint: APIEndPoint, req: express.Request, res: express.Response): (() => Promise<any>)[] {
        return preprocessors.map(p => p.preprocess.bind(p, endPoint, req, res));
    }

    /**
     * Wrap every call on an API end-point
     * @param {APIEndPoint} endPoint
     * @param {e.Request} req
     * @param {e.Response} res
     * @param {NextFunction} next
     * @TODO Refactor
     */
    public async wrap(endPoint: APIEndPoint, req: express.Request, res: express.Response, next: express.NextFunction) {

        // building promises of promises
        const promises: (() => Promise<any>)[][] = this.preprocessors.map(
            preprocessors => {
                return this.preprocessorsToPromiseGenerator(preprocessors, endPoint, req, res);
            }
        );

        try {
            // preprocess
            let result: any = await this.chainParallelPromises(promises);

            // custom middle
            if (typeof endPoint.middlewares !== 'undefined')
                await Promise.all(endPoint.middlewares.map(middleware => middleware(req, res)));

            // meaning that one of the preprocessor wanted to terminate the request
            if (typeof result !== 'undefined') {

                const data: string = typeof result === 'string' ? result : JSON.stringify({data: result});
                res.type('application/json');
                res.send(data);
                return;
            }
            
            // not supposed to happen because the last preprocessor always return a value
            throw new Error("Unexpected end of file");
        } catch (e) {

            // error occurred during loading or request
            res.json({error: {message: e.message}});
        }
    }
}