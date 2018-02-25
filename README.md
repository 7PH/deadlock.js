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
- [ ] MongoDB support
- [ ] HTTP2 Support
- [ ] TLS Support
- [ ] Logs
- [ ] Internal statistics
- [ ] Internal API to interact with the server (statistics, retrieve documentation, ip blacklist/whitelist, etc)

## Known issues
- [ ] Rate limit are handled per process. If you set up a 1 rqt/sec rate limit and 4 workers, in the worst case scenario, one could send 4 requests per second (each on a distinct worker)


## Dependencies
This library uses io-filter to validate request body

@SEE https://github.com/7PH/io-filter

## Examples

### Hello World

Here is a simple working example, without database connection and rate limit:
```typescript

import {APIDescription, APIRouteType, DeadLockJS} from "deadlockjs";
import * as express from 'express';

const api: APIDescription = {
    appSecret: '',
    workers: 4,
    port: 3000,
    root: {
        kind: APIRouteType.DIRECTORY,
        path: '/api/v1',
        routes: [
            {
                kind: APIRouteType.END_POINT,
                path: '/',
                method: 'get',
                handler: async (req: express.Request, res: express.Response) => { return {a: Math.random()}; }
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
import {APIDescription, APIRouteType, DeadLockJS} from "deadlockjs";
import {ObjectFilter, RegExpFilter, ValueTypeFilter} from "io-filter";
import * as express from 'express';

const api: APIDescription = {
    appSecret: '',
    workers: 4,
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
        kind: APIRouteType.DIRECTORY,
        path: '/api/v1',
        middleware: (req: express.Request, res: express.Response, next: express.NextFunction) => {
            if (Math.random() < 0.5) {
                next();
            } else {
                res.json({message: "nope"});
            }
        },
        routes: [
            {
                kind: APIRouteType.END_POINT,
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
                handler: async (req: express.Request, res: express.Response) => {
                    // res.locals.dl.mysql -> MySQL Pool Connection
                    // res.locals.dl.params -> {pseudo: string, password: string}
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