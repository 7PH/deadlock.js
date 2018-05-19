import {Request, Response} from "express";
import {APIDescription} from "./deadlockjs/api/description/APIDescription";
import {APIRouteType} from "./deadlockjs/api/description/APIRouteType";
import {DeadLockJS} from "./deadlockjs/DeadLockJS";
import {ObjectFilter, ValueTypeFilter} from "io-filter";
import * as jwt from 'jsonwebtoken';
import {RequestLocal} from "./deadlockjs/api/wrapper/local/RequestLocal";

const api: APIDescription = {
    appSecret: '1f4600bc0380273f90ed02db217cfbf',
    workers: 2,
    port: 3000,
    ipBlacklist: [],
    rateLimit: {
        ipWhitelist: [],
        weight: 1,
        maxPending: 0,
        maxWeightPerSec: 1
    },
    db: {
        mongodb: {
            url: "mongodb://localhost:27017"
        }
    },
    cache: {
        expire: 2000
    },
    root: {
        kind: APIRouteType.DIRECTORY,
        path: '/api/v1',
        middleware: [async (req: Request, res: Response) => { return; }],
        routes: [
            {
                kind: APIRouteType.END_POINT,
                path: '/login',
                method: 'post',
                db: {mysql: true},
                paramFilter: new ObjectFilter({
                    token: new ValueTypeFilter('string')
                }),
                handler: async (dl: RequestLocal) => {
                    return jwt.verify(dl.requestInfo.params.token, 'Nope', {algorithms: ['HS256']});
                }
            },
            {
                kind: APIRouteType.END_POINT,
                path: '/',
                method: 'get',
                rateLimit: {weight: 10},
                cache: {expire: 1000},
                db: {mysql: true},
                handler: async (dl: RequestLocal) => {
                    throw new Error("Nope");
                }
            }
        ]
    }
};


DeadLockJS.startApp(api);