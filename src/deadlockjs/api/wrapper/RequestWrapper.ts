import {APIDescription, APIEndPoint} from "../../../";
import * as express from "express";
import {IPreprocessor} from "./preprocessor/IPreprocessor";
import {RequestBodyChecker} from "./preprocessor/RequestBodyChecker";
import {MySQLCleaner} from "./preprocessor/MySQLCleaner";
import {MySQLProvider} from "./preprocessor/MySQLProvider";
import {IRequestWrapper} from "./IRequestWrapper";
import {RateLimiter} from "./preprocessor/RateLimiter";
import {RequestInitializer} from "./preprocessor/RequestInitializer";
import {GateKeeper} from "./preprocessor/GateKeeper";
import {PromiseCaching} from "promise-caching";

export class RequestWrapper implements IRequestWrapper {

    /**
     * Preprocess to do. List of list
     * There will be executed as a series of parallel promises.
     *   example:
     *      p = [[a, b], [c, d]]
     *          a, b will be executed in parallel.
     *          THEN, if all resolves, c and d will be executed in parallel
     * @type {Array<Array<IPreprocessor>>}
     */
    public readonly preprocessors: Array<Array<IPreprocessor>> = [];

    /**
     * @param {APIDescription} api
     */
    constructor(private api: APIDescription) {
        this.preprocessors = [
            [
                new RequestInitializer()
            ],
            [
                new GateKeeper(api),
                new RateLimiter(api),
                new RequestBodyChecker(),
                new MySQLCleaner(),
            ],
            [
                new MySQLProvider(api),
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
                return preprocessors.map(
                    preprocessor => preprocessor.preprocess.bind(preprocessor, endPoint, req, res)
                );
            }
        );

        try {
            // preprocess
            await this.chainParallelPromises(promises);
            // handling request
            let result: any;
            if (this.api.cache != null) {
                let expire: number = typeof endPoint.cache !== 'undefined' ? endPoint.cache.expire : this.api.cache.expire;
                result = await PromiseCaching.get(endPoint, expire, endPoint.handler.bind(this, req, res));
            } else {
                result = await endPoint.handler(req, res);
            }
            // result output
            res.json(result);
        } catch (e) {
            // error occurred during loading or request
            res.json({error: {message: e.message}});
        }
    }
}