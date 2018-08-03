import {APIDescription} from "./api/description/APIDescription";
import * as express from "express";
import {Application, NextFunction, Request, RequestHandler, Response} from "express";
import {APIDirectory} from "./api/description/APIDirectory";
import {APIEndPoint} from "./api/description/APIEndPoint";
import {RequestWrapper} from "./api/wrapper/RequestWrapper";
import * as bodyParser from "body-parser";
import * as spdy from "spdy";
import * as cluster from "cluster";
import {APIMiddleware} from "./api/description/APIMiddleware";
import * as multer from "multer";
import * as cors from "cors";

/**
 * Main utility class
 */
export class DeadLockJS {

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
        const app: Application = DeadLockJS.getApp(api);
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
            server.listen(api.port, api.hostname, (err: any) => {
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

        // cors
        if (typeof api.cors !== 'undefined')
            app.use(cors(api.cors));

        // file upload
        if (typeof api.globalUpload !== "undefined") {
            const upload: multer.Instance = multer(api.globalUpload);
            app.use(upload.any());
        }

        // usual uploads
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));
        //app.use(cookieParser());
        if (api.static)
            app.use(express.static(api.static));

        // attach the API here
        app.use('/', DeadLockJS.buildRouter(api));

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
            {[api.basePath || '/']: api.root},
            api.root,
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
    private static buildRouterForRoutes(api: APIDescription, wrapper: RequestWrapper, routes: {[path: string]: APIDirectory | APIEndPoint}, parent: APIDirectory, path: string, depth: number): express.Router {
        // builds the current directory router
        const router: express.Router = express.Router({mergeParams: true});

        // attach the job executor(s)
        if (parent.middleware != null && depth > 0)
            router.use(DeadLockJS.buildMiddleware(parent.middleware));

        // attach directory routes
        for (const routePath in routes) {
            const route: APIDirectory | APIEndPoint = routes[routePath];

            if (typeof (route as APIDirectory).routes === 'undefined') {

                /**
                 * A end-point is an application entry-point. It can be a get, post, .. handler.
                 */

                if (api.verbose)
                    console.log(DeadLockJS.endPointToString(api, route as APIEndPoint, path + routePath));
                let handler: RequestHandler = wrapper.wrap.bind(wrapper, route as APIEndPoint);
                router[(route as APIEndPoint).method](routePath, handler);

            } else {

                /**
                 * A directory is a list of routes (which can be directory themselves or end point (get, post, .. handlers)
                 *   One jobexecutor or more can be attached to a directory
                 */

                if (api.verbose)
                    console.log(path + routePath + " (directory)");
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
        let s: string = "";
        s += (endPoint.method.toUpperCase() + ":").padEnd(6) + path;
        if (typeof api.rateLimit !== 'undefined') {
            let weight: number = (endPoint.rateLimit || api.rateLimit).weight as number;
            let rqtPerSec = api.rateLimit.maxWeightPerSec / weight;
            s += "\n    RateLimit: " + rqtPerSec + " rqt/sec";
        }
        if (typeof endPoint.cache !== 'undefined')
            s += "\n    Caching: " + endPoint.cache.expire + "ms";
        if (typeof endPoint.paramFilter !== 'undefined')
            s += "\n    " + endPoint.paramFilter.toString();
        return s;
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