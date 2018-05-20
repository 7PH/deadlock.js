import {APIDescription} from "./api/description/APIDescription";
import * as express from "express";
import {Application, NextFunction, Request, RequestHandler, Response} from "express";
import {APIDirectory} from "./api/description/APIDirectory";
import {APIEndPoint} from "./api/description/APIEndPoint";
import {APIRouteType} from "./api/description/APIRouteType";
import {RequestWrapper} from "./api/wrapper/RequestWrapperImpl";
import * as path from "path";
import * as bodyParser from "body-parser";
import * as http from "http";
import * as cluster from "cluster";
import {PromiseCaching} from "promise-caching";
import {APIMiddleware} from "./api/description/APIMiddleware";
import * as multer from "multer";

/**
 * Main utility class
 */
export class DeadLockJS {

    /**
     * Build and start an express app with a specified api description
     * @param {APIDescription} api
     */
    public static startApp(api: APIDescription): void {
        if (cluster.isMaster) {
            // spawns workers
            for (let i = 0; i < api.workers; i ++)
                cluster.fork();
            return;
        }

        if (cluster.isWorker) {
            // These are the workers handling http requests
            const app: Application = DeadLockJS.getApp(api);
            http.createServer(app).listen(api.port, api.hostname);
            return;
        }
    }

    /**
     * Build the express app matching the provided api description
     * @param {APIDescription} api
     * @returns {e.Application}
     */
    private static getApp(api: APIDescription): express.Application {
        const app = express();

        // view engine setup

        // uncomment after placing your favicon in /public
        //app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
        //app.use(logger('dev'));
        app.use(function (req: any, res: any, next: any) {
            res.removeHeader("X-Powered-By");
            next();
        });

        // file upload
        if (typeof api.globalUpload !== "undefined") {
            const upload: multer.Instance = multer(api.globalUpload);
            app.use(upload.any());
        }

        // usual uploads
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));
        //app.use(cookieParser());
        app.use(express.static(path.join(__dirname, 'public')));


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
            // set locals, only providing error in development
            res.locals.message = err.message;
            res.locals.error = req.app.get('env') === 'development' ? err : {};
            // render the error page
            res.status(err.status || 500);
            res.json({error: err.message});
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
            new RequestWrapper(new PromiseCaching(), api),
            [api.root],
            api.root,
            '',
            0);
    }

    /**
     * Instantiates a new router for the specified routes
     * @param {RequestWrapper} wrapper The request wrapper
     * @param {Array<APIDirectory | APIEndPoint>} routes Routes to attach to the created router
     * @param {APIDirectory} parent Parent directory
     * @param {string} path Current path (for output)
     * @param {number} depth Current depth of router
     * @returns {e.Router}
     */
    private static buildRouterForRoutes(api: APIDescription, wrapper: RequestWrapper, routes: Array<APIDirectory | APIEndPoint>, parent: APIDirectory, path: string, depth: number): express.Router {
        // builds the current directory router
        const router: express.Router = express.Router({mergeParams: true});

        // attach the preprocessor(s)
        if (parent.middleware != null && depth > 0)
            router.use(DeadLockJS.buildMiddleware(parent.middleware));

        // attach directory routes
        for (let i in routes) {
            const route: APIDirectory | APIEndPoint = routes[i];

            switch (route.kind) {

                /**
                 * A directory is a list of routes (which can be directory themselves or end point (get, post, .. handlers)
                 *   One preprocessor or more can be attached to a directory
                 */
                case APIRouteType.DIRECTORY:
                    // output new path
                    //console.log(path + (route as APIDirectory).path + " (directory)");
                    // recursively builds the router for sub-directory
                    let subRouter: express.Router = this.buildRouterForRoutes(api, wrapper, (route as APIDirectory).routes, route as APIDirectory, path + (route as APIDirectory).path, depth + 1);
                    // attach the router
                    router.use((route as APIDirectory).path, subRouter);
                    break;

                /**
                 * A end-point is an application entry-point. It can be a get, post, .. handler.
                 */
                case APIRouteType.END_POINT:
                    console.log(DeadLockJS.endPointToString(api, route as APIEndPoint, path) + "\n");
                    let handler: RequestHandler = wrapper.wrap.bind(wrapper, route as APIEndPoint);
                    router[(route as APIEndPoint).method]((route as APIEndPoint).path, handler);
                    break;
            }
        }
        return router;
    }

    public static endPointToString(api: APIDescription, endPoint: APIEndPoint, path: string): string {
        let s: string = "";
        s += (endPoint.method.toUpperCase() + ":").padEnd(6) + path + endPoint.path;
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