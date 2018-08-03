# DeadLockJS

Lightweight Node.js/Express framework written in TypeScript for building secure, clustered and well-designed APIs.


Still under development, not finished yet


## Install

The easiest way to install deadlockjs is with [`npm`][npm].

[npm]: https://www.npmjs.com/

```sh
npm i --save deadlockjs
```

## Features

All these features are optional. See examples below 
- [X] Full API specification in a single object
- [X] Layer 7 DDoS mitigation (delay and drop)
- [X] IP Whitelist for rate limit
- [X] Built-in request caching (@SEE promise-caching)
- [X] MySQL pool management, dynamic release of connections
- [X] Request body validation and filtering
- [X] Clustering
- [X] IP Blacklist
- [X] MongoDB support
- [X] File upload
- [X] CORS management
- [X] HTTP2 Support
- [X] HTTPS Support
- [ ] Logs
- [ ] Internal statistics
- [ ] Internal API to interact with the server (statistics, retrieve documentation, ip blacklist/whitelist, etc)

## Examples

### Hello World

Here is a simple working example, without database connection and rate limit:
```typescript

import {APIDescription, APIRouteType, DeadLockJS, RequestLocal} from "deadlockjs";

const api: APIDescription = {
    workers: 4,
    port: 3000,
    root: {
        path: '/api/v1',
        routes: [
            {
                method: 'get',
                handler: async () => ({a: 42})
            }
        ]
    }
};

DeadLockJS.startApp(api);
```

That's all you need to get your web server up and running! 

### Complex example

Here is an example of a web app with custom middleware, rate limit, mysql connection, and request body validation

```typescript
import {APIDescription, APIRouteType, DeadLockJS, RequestLocal} from "deadlockjs";
import {ObjectFilter, RegExpFilter, ValueTypeFilter} from "io-filter";

const api: APIDescription = {
    appSecret: 'c416c7191a40ee5db3c451cbd3a10f22',
    workers: 4,
    cors: {
        origin: "http://localhost:3000"
    },
    port: 3000,
    db: {
        mysql: {
            port: 3306,
            host: 'localhost',
            user: 'myuser',
            password: 'mypassword',
            database: 'mydatabase',
            connectionLimit: 100
        }
    },
    ipBlacklist: [],
    rateLimit: {
        ipWhitelist: ['::1'],
        weight: 10,
        maxPending: 0,
        maxWeightPerSec: 100
    },
    /** if you don't define a global 'cache' property, cache system won't be activated */
    cache: {
        /** default expire time */
        expire: 2000
    },
    root: {
        path: '/api/v1',
        middleware: async (req: express.Request, res: express.Response) => {
            if (Math.random() < 0.5)
                throw new Error("Not allowed");
        },
        routes: [
            {
                path: '/login',
                method: 'post',
                rateLimit: {weight: 80},
                paramFilter: new ObjectFilter({
                    pseudo: new RegExpFilter(/^[a-zA-Z0-9]{3,20}$/),
                    password: new ValueTypeFilter('string')
                }),
                dbConnection: true,
                cache: {
                    /** expire time in milliseconds: override defaut configuration */
                    expire: 1000
                },
                handler: async (dl: RequestLocal) => {
                    // dl.mysql -> MySQL Pool Connection
                    // dl.requestInfo.params -> {pseudo: string, password: string}
                    return {a: Math.random()};
                }
            }
        ]
    }
};

DeadLockJS.startApp(api);
```

Therefore, I would strongly suggest to make controller handlers into separate files.

Keep in mind that each worker will allocate a MySQL Pool with 'connectionLimit' connections.

Also, the appSecret has no use at the moment but it will be used later to handle interactions with the web server, such as retrieving logs, statistics, editing configuration. There will be a cooldown for appSecret authentication, but you should use a secure one.

## See also

I made another library to handle caching promises

@SEE https://github.com/7PH/Promise-Caching