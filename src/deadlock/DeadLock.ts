import {APIDescription} from "./api/description";
import * as express from "express";
import {Application, NextFunction, Request, RequestHandler, Response} from "express";
import {APIDirectory} from "./api/description";
import {APIEndPoint} from "./api/description";
import {RequestWrapper} from "./api/wrapper";
import * as bodyParser from "body-parser";
import * as spdy from "spdy";
import * as cluster from "cluster";
import {APIMiddleware} from "./api/description";
import * as multer from "multer";
import * as cors from "cors";
import * as cookieParser from "cookie-parser";
import {APIEndPointHandler} from "./api/description";
import * as morgan from "morgan";

/**
 * Main utility class
 */
export class DeadLock {

    /**
     * Build and start an express app with a specified api description
     * @param {APIDescription} api
     */
    public static startApp(api: APIDescription): Promise<spdy.Server> {
        if (cluster.isMaster) {
            // spawns workers
            const workers = api.workers || 1;
            for (let i = 0; i < workers - 1; i ++)
                cluster.fork();
        }

        // These are the workers handling http requests
        const app: Application = DeadLock.getApp(api);
        const options: spdy.ServerOptions = {};
        if (api.ssl) {
            options.spdy = {plain: false};
            options.key = api.ssl.key;
            options.cert = api.ssl.cert;
        } else {
            options.spdy = {plain: true};
        }
        const server: spdy.Server = spdy.createServer(options, app);

        return new Promise((resolve, reject) => {
            server.listen(api.port || 80, api.hostname || 'localhost', (err: any) => {
                if (err) reject(err);
                else resolve(server)
            });
        });
    }

    /**
     * Build the express app matching the provided api description
     * @param {APIDescription} api
     * @returns {e.Application}
     */
    private static getApp(api: APIDescription): express.Application {
        const app: express.Application = express();

        // view engine setup

        // uncomment after placing your favicon in /public
        //app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
        //app.use(logger('dev'));
        app.use(function (req: any, res: any, next: any) {
            res.removeHeader("X-Powered-By");
            next();
        });

        // logs
        if (typeof api.logger !== 'undefined')
            app.use(morgan(api.logger.format, api.logger.options));

        // cors
        if (typeof api.cors !== 'undefined')
            app.use(cors(api.cors));

        // file upload
        if (typeof api.globalUpload !== "undefined") {
            const upload: multer.Instance = multer(api.globalUpload);
            app.use(upload.any());
        }

        // cookies?
        if (api.cookies)
            app.use(cookieParser());

        // usual uploads
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));

        if (api.static)
            app.use(express.static(api.static));

        // attach the API here
        app.use('/', DeadLock.buildRouter(api));

        // catch 404 and forward to error handler
        app.use(function(req: any, res: any, next: any) {
            const err: any = new Error('Not Found');
            err.status = 404;
            next(err);
        });

        // error handler
        app.use(function(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
            const code = err.status || 404;
            res.status(code);
            res.json({error: {message: err.message, code}});
        });

        return app;
    }

    /**
     * Build the router of an API Description
     * @param {APIDescription} api
     * @returns {e.Router}
     */
    private static buildRouter (api: APIDescription): express.Router {
        return this.buildRouterForRoutes(
            api,
            new RequestWrapper(api),
            {[api.basePath || '/']: api},
            api,
            '',
            0);
    }

    /**
     * Instantiates a new router for the specified routes
     * @param api
     * @param {RequestWrapper} wrapper The request wrapper
     * @param {Array<APIDirectory | APIEndPoint>} routes Routes to attach to the created router
     * @param {APIDirectory} parent Parent directory
     * @param {string} path Current path (for output)
     * @param {number} depth Current depth of router
     * @returns {e.Router}
     */
    private static buildRouterForRoutes(api: APIDescription, wrapper: RequestWrapper, routes: {[path: string]: APIDirectory | APIEndPoint | APIEndPointHandler}, parent: APIDirectory, path: string, depth: number): express.Router {
        // builds the current directory router
        const router: express.Router = express.Router({mergeParams: true});

        // attach the job executor(s)
        if (parent.middleware != null && depth > 0)
            router.use(DeadLock.buildMiddleware(parent.middleware));

        // attach directory routes
        for (const routePath in routes) {
            const route: APIDirectory | APIEndPoint | APIEndPointHandler = routes[routePath];

            if (typeof (<any>route).routes === 'undefined') {

                /**
                 * A end-point is an application entry-point. It can be a get, post, .. handler.
                 */

                let endPoint: APIEndPoint;

                if (typeof (<any>route).handler === 'undefined')
                    endPoint = {handler: route as APIEndPointHandler};
                else
                    endPoint = route as APIEndPoint;

                if (typeof endPoint.method === 'undefined')
                    endPoint.method = ['get', 'post', 'put', 'delete'];

                if (api.verbose)
                    console.log(DeadLock.endPointToString(api, endPoint, path + routePath));

                // attach handler to route with provided methods
                const handler: RequestHandler = wrapper.wrap.bind(wrapper, endPoint);
                if (typeof endPoint.method === 'string')
                    router[endPoint.method](routePath, handler);
                else
                    for (let method of endPoint.method)
                        router[method](routePath, handler);


            } else {

                /**
                 * A directory is a list of routes (which can be directory themselves or end point (get, post, .. handlers)
                 *   One jobexecutor or more can be attached to a directory
                 */

                if (api.verbose)
                    console.log(DeadLock.directoryToString(path + routePath));
                let subRouter: express.Router = this.buildRouterForRoutes(api, wrapper, (route as APIDirectory).routes, route as APIDirectory, path + routePath, depth + 1);
                router.use(routePath, subRouter);
            }
        }
        return router;
    }

    /**
     *
     * @param {APIDescription} api
     * @param {APIEndPoint} endPoint
     * @param {string} path
     * @returns {string}
     */
    public static endPointToString(api: APIDescription, endPoint: APIEndPoint, path: string): string {
        let out: string = "";
        let methods: string;
        if (typeof endPoint.method === 'string')
            methods = endPoint.method;
        else if (typeof endPoint.method === 'object')
            methods = endPoint.method.join('|');
        else
            methods = '*';
        out += DeadLock.padEnd(methods.toUpperCase() + ":", 32) + path;
        if (typeof api.rateLimit !== 'undefined') {
            let weight: number = (endPoint.rateLimit || api.rateLimit).weight as number;
            let rqtPerSec = api.rateLimit.maxWeightPerSec / weight;
            out += "\n    RateLimit: " + rqtPerSec + " rqt/sec";
        }
        if (typeof endPoint.cache !== 'undefined')
            out += "\n    Caching: " + endPoint.cache.expire + "ms";
        if (typeof endPoint.paramFilter !== 'undefined')
            out += "\n    " + endPoint.paramFilter.toString();
        return out;
    }

    /**
     *
     * @param {APIDescription} api
     * @param {APIEndPoint} endPoint
     * @param {string} path
     * @returns {string}
     */
    public static directoryToString(path: string): string {
        return DeadLock.padEnd("DIR/", 32) + path;
    }

    /**
     *
     * @param {string} str
     * @param {number} count
     * @returns {string}
     */
    public static padEnd(str: string, count: number): string {
        return str.length >= count ? str : this.padEnd(str + ' ', count);
    }

    /**
     *
     * @param {APIMiddleware | APIMiddleware[]} middleware
     * @returns {e.RequestHandler}
     */
    private static buildMiddleware(middleware: APIMiddleware[]): RequestHandler {
        return function(req: Request, res: Response, next: NextFunction) {
            Promise.all(middleware.map(middle => middle(req, res)))
                .then(result => {
                    next();
                })
                .catch(error => {
                    res.json({error: {message: error.message}});
                });
        }
    }
}
