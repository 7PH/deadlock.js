import {APIDescription, APIEndPoint} from "../../../";
import * as express from "express";
import {IPreprocessor} from "./preprocessor/IPreprocessor";
import {RequestBodyChecker} from "./preprocessor/RequestBodyChecker";
import {DBConnectionCleaner} from "./preprocessor/DBConnectionCleaner";
import {DBConnectionProvider} from "./preprocessor/DBConnectionProvider";
import {IRequestWrapper} from "./IRequestWrapper";
import {RateLimiter} from "./preprocessor/RateLimiter";
import {RequestInitializer} from "./preprocessor/RequestInitializer";
import {GateKeeper} from "./preprocessor/GateKeeper";

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
    constructor(api: APIDescription) {
        this.preprocessors = [
            [
                new RequestInitializer()
            ],
            [
                new GateKeeper(api),
                new RateLimiter(api),
                new RequestBodyChecker(),
                new DBConnectionCleaner(),
            ],
            [
                new DBConnectionProvider(api),
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
    public wrap(endPoint: APIEndPoint, req: express.Request, res: express.Response, next: express.NextFunction): void {

        // building promises of promises
        const promises: (() => Promise<any>)[][] = this.preprocessors.map(
            preprocessors => {
                return preprocessors.map(
                    preprocessor => preprocessor.preprocess.bind(preprocessor, endPoint, req, res)
                );
            }
        );

        // getting main promise
        this.chainParallelPromises(promises)
            .then(this.execute.bind(this, endPoint, req, res))
            .catch((reason: Error) => {
                res.json({error: {message: "Request wrapper error: " + reason.message}});
            });
    }

    private execute(endPoint: APIEndPoint, req: express.Request, res: express.Response): void {
        try {
            endPoint.handler(req, res);
        } catch (e) {
            res.json({error: {message: "An error occurred"}});
        }
    }
}