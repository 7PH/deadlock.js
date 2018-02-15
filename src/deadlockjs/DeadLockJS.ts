import {APIDescription, APIDirectory, APIEndPoint, APIRouteType} from "./api/APIDescription";
import * as express from "express";


/**
 * Main utilitary class
 */
export class DeadLockJS {

    /**
     * Build the router of an API Description
     * @param {APIDescription} api
     * @returns {e.Router}
     */
    static buildRouter (api: APIDescription): express.Router {
        return DeadLockJS.buildRouterForRoutes([api.root], api.root, '');
    }

    /**
     * Instantiates a new router for the specified routes
     * @param {Array<APIDirectory | APIEndPoint>} routes Routes to attach to the created router
     * @param {APIDirectory} parent Parent directory
     * @param {string} path Current path (for output)
     * @returns {e.Router}
     */
    static buildRouterForRoutes(routes: Array<APIDirectory | APIEndPoint>, parent: APIDirectory, path: string): express.Router {
        // builds the current directory router
        const router: express.Router = express.Router();

        // attach the middleware(s)
        if (parent.middleware != null)
            router.use(parent.middleware);

        // attach directory routes
        for (let i in routes) {
            const route: APIDirectory | APIEndPoint = routes[i];

            switch (route.kind) {

                /**
                 * A directory is a list of routes (which can be directory themselves or end point (get, post, .. handlers)
                 *   One middleware or more can be attached to a directory
                 */
                case APIRouteType.DIRECTORY:
                    // append current path to global path
                    path = path + (route as APIDirectory).path;
                    // output new path
                    //console.log(path + " (directory)");
                    // recursively builds the router for sub-directory
                    let subRouter: express.Router = DeadLockJS.buildRouterForRoutes((route as APIDirectory).routes, route as APIDirectory, path);
                    // attach the router
                    router.use((route as APIDirectory).path, subRouter);
                    break;

                /**
                 * A end-point is an application entry-point. It can be a get, post, .. handler.
                 */
                case APIRouteType.ENDPOINT:
                    console.log(path + (route as APIEndPoint).path + " (" + (route as APIEndPoint).method + ")");
                    router[(route as APIEndPoint).method]((route as APIEndPoint).path, (route as APIEndPoint).handler);
                    break;
            }
        }
        return router;
    }
}