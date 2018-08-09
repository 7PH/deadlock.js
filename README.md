# deadlock.js
Lightweight Node.js/Express framework written in TypeScript for building secured, clustered and well-designed APIs.

Still under development, not finished yet


## Install
The easiest way to install deadlockjs is with [`npm`][npm].

[npm]: https://www.npmjs.com/

```sh
npm i --save deadlockjs
```

## Features
Here is te main list of feature that deadlock.js aims to provide.
- [X] full API specification in a single object
- [X] rate limit - delay and drop requests
- [X] ip whitelist&blacklist for rate limit
- [X] request caching
- [X] mysql pool
- [X] mongodb
- [X] request body parsing, validation and filtering
- [X] clustering
- [X] file upload
- [X] cors handling
- [X] https & http2 Support
- [ ] logs
- [ ] internal statistics (hits, execution time)
- [ ] internal api (retrieve stats, dynamically change route, ip blacklist/whitelist, etc)

## Examples

### Hello World
Here is a simple working example with only request caching in javascript
```javascript

const DeadLockJS = require('deadlockjs').DeadLockJS;

const api = {
    routes: {
        '/': {
            method: 'get',
            handler: async () => 42
        }
    }
};

DeadLockJS
    .startApp(api)
    .then(() => console.log("Server started"));
```

That's all you need to get your web server up and running! 

### Complex example

Here is an example of a web app with custom middleware, rate limit, mysql connection, and request body validation

```typescript
import {APIDescription, APIRouteType, DeadLockJS, RequestLocal} from "deadlockjs";
import {ObjectFilter, RegExpFilter, ValueTypeFilter} from "io-filter";

const api: APIDescription = {
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
    basePath: '/api/v1',
    middleware: async (req: express.Request, res: express.Response) => {
        if (Math.random() < 0.5)
            throw new Error("Not allowed");
    },
    routes: {
        '/login': {
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
    }
};

DeadLockJS.startApp(api);
```

Each worker will allocate a MySQL Pool with 'connectionLimit' connections.
