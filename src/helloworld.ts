import * as express from "express";
import {APIDescription} from "./deadlockjs/api/description/APIDescription";
import {APIRouteType} from "./deadlockjs/api/description/APIRouteType";
import {DeadLockJS} from "./deadlockjs/DeadLockJS";


const api: APIDescription = {
    appSecret: '1f4600bc0380273f90ed02db217cfbf',
    workers: 2,
    port: 3000,
    ipBlacklist: [],
    rateLimit: {
        ipWhitelist: ['::1'],
        weight: 1,
        maxPending: 0,
        maxWeightPerSec: 1
    },
    root: {
        kind: APIRouteType.DIRECTORY,
        path: '/api/v1',
        routes: [
            {
                kind: APIRouteType.END_POINT,
                path: '/',
                method: 'get',
                handler: (req: express.Request, res: express.Response) => { res.json({hello: "world"}); }
            }
        ]
    }
};


DeadLockJS.startApp(api);