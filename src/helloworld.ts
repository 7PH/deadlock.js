import {APIDescription} from "./deadlockjs/api/description/APIDescription";
import {APIRouteType} from "./deadlockjs/api/description/APIRouteType";
import {DeadLockJS} from "./deadlockjs/DeadLockJS";
import {RequestLocal} from "./deadlockjs/api/wrapper/local/RequestLocal";

const api: APIDescription = {
    appSecret: '',
    workers: 1,
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
        routes: [
            {
                kind: APIRouteType.END_POINT,
                path: '/',
                method: 'post',
                db: {mongodb: true},
                handler: async (dl: RequestLocal) => {
                    return {
                        files: dl.express.req.files,
                        body: dl.express.req.body
                    }
                }
            }
        ]
    }
};


DeadLockJS.startApp(api);