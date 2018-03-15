import {APIDescription, APIEndPoint} from "../../../";
import * as express from "express";
import {Preprocessor} from "./preprocessor/Preprocessor";
import {RequestBodyChecker} from "./preprocessor/RequestBodyChecker";
import {MySQLCleaner} from "./preprocessor/MySQLCleaner";
import {MySQLProvider} from "./preprocessor/MySQLProvider";
import {IRequestWrapper} from "./RequestWrapper";
import {RateLimiter} from "./preprocessor/RateLimiter";
import {RequestInitializer} from "./preprocessor/RequestInitializer";
import {GateKeeper} from "./preprocessor/GateKeeper";
import {PromiseCaching} from "promise-caching";
import {MongoDBProvider} from "./preprocessor/MongoDBProvider";
import {MongoDBCleaner} from "./preprocessor/MongoDBCleaner";
import {response} from "spdy";
import end = response.end;

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
    constructor(private cache: PromiseCaching, private api: APIDescription) {
        this.preprocessors = [
            [
                new RequestInitializer()
            ],
            [
                new GateKeeper(api),
                new RateLimiter(api),
                new RequestBodyChecker(),
                new MySQLCleaner(),
                new MongoDBCleaner(),
            ],
            [
                new MySQLProvider(api),
                new MongoDBProvider(api),
            ]
        ];
    }

    /**
     *
     * @param {(() => Promise<any>)[][]} jobs
     * @returns {Promise<any>}
     */
    private chainParallelPromises(jobs: (() => Promise<any>)[][]): Promise<any> {
        // no job to do
        if (jobs.length == 0) return Promise.resolve();

        // build promise list of parallel tasks to do
        const promises: (() => Promise<any>)[] = jobs.map(job => {
            return () => Promise.all(
                job.map(fun => fun())
            );
        });

        const first: () => Promise<any> = promises.shift() as (() => Promise<any>);

        return promises.reduce((promiseChain, currentTask) => {
            return promiseChain.then(currentTask);
        }, first());
    }

    private preprocessorsToPromiseGenerator(preprocessors: Preprocessor[], endPoint: APIEndPoint, req: express.Request, res: express.Response): (() => Promise<any>)[] {
        return preprocessors.map(
            preprocessor =>
                preprocessor.preprocess.bind(preprocessor, endPoint, req, res)
        );
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
            await this.chainParallelPromises(promises);

            // custom middle
            if (typeof endPoint.middlewares !== 'undefined') {
                await Promise.all(
                    endPoint.middlewares.map(
                        middleware => middleware.bind(middleware, req, res)
                    )
                );
            }

            // handling request
            let result: any;

            if (endPoint.cache != null) {
                let expire: number = (endPoint.cache || this.api.cache || {expire: 1000}).expire;
                result = await this.cache.get(endPoint, expire, endPoint.handler.bind(this, req, res));
            } else {
                result = await endPoint.handler(req, res);
            }
            // result output
            if (result == null) result = {};
            res.json({error: undefined, data: result});
        } catch (e) {
            // error occurred during loading or request
            res.json({error: {message: e.message}});
        }
    }
}