"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var APIDescription_1 = require("./APIDescription");
var express = require("express");
/**
 * Main utilitary class
 */
var DeadLockJS = /** @class */ (function () {
    function DeadLockJS() {
    }
    /**
     * Build the router of an API Description
     * @param {APIDescription} api
     * @returns {e.Router}
     */
    DeadLockJS.buildRouter = function (api) {
        return DeadLockJS.buildRouterForRoutes([api.root], api.root, '');
    };
    /**
     * Instantiates a new router for the specified routes
     * @param {Array<APIDirectory | APIEndPoint>} routes Routes to attach to the created router
     * @param {APIDirectory} parent Parent directory
     * @param {string} path Current path (for output)
     * @returns {e.Router}
     */
    DeadLockJS.buildRouterForRoutes = function (routes, parent, path) {
        // builds the current directory router
        var router = express.Router();
        // attach the middleware(s)
        if (parent.middleware != null)
            router.use(parent.middleware);
        // attach directory routes
        for (var i in routes) {
            var route = routes[i];
            switch (route.kind) {
                /**
                 * A directory is a list of routes (which can be directory themselves or end point (get, post, .. handlers)
                 *   One middleware or more can be attached to a directory
                 */
                case APIDescription_1.APIRouteType.DIRECTORY:
                    // append current path to global path
                    path = path + route.path;
                    // output new path
                    //console.log(path + " (directory)");
                    // recursively builds the router for sub-directory
                    var subRouter = DeadLockJS.buildRouterForRoutes(route.routes, route, path);
                    // attach the router
                    router.use(route.path, subRouter);
                    break;
                /**
                 * A end-point is an application entry-point. It can be a get, post, .. handler.
                 */
                case APIDescription_1.APIRouteType.ENDPOINT:
                    console.log(path + route.path + " (" + route.method + ")");
                    router[route.method](route.path, route.handler);
                    break;
            }
        }
        return router;
    };
    return DeadLockJS;
}());
exports.DeadLockJS = DeadLockJS;
