![](./doc/logo.png)

<p align="center">
    <img src="https://img.shields.io/badge/build-passing-brightgreen.svg" />
    <img src="https://img.shields.io/badge/npm-v1.4.3-brightgreen.svg" />
</p>

## intro
Lightweight Node.js/Express framework written in TypeScript for building secured, clustered and well-designed APIs.


## install
The easiest way to install deadlockjs is with [`npm`][npm].

[npm]: https://www.npmjs.com/

```sh
npm i --save deadlockjs
```

## features
Here are the main features provided by deadlock.js
- [x] full API specification in a single object
- [x] rate limit - delay and drop requests
- [x] ip whitelist&blacklist for rate limit
- [x] request caching
- [x] mysql pool
- [x] mongodb
- [x] request body parsing, validation and filtering
- [x] clustering
- [x] file upload
- [x] cors handling
- [x] https & http2 Support
- [x] logs
- [ ] internal statistics (hits, execution time)
- [ ] internal api (retrieve stats, dynamically change route, ip blacklist/whitelist, etc)

## examples
### hello world
Here is a simple working example
```javascript

const DeadLock = require('deadlockjs').DeadLock;

const api = {
    routes: {
        '/': async () => "Hello World"
    }
};

DeadLock
    .startApp(api)
    .then(() => console.log("Server started"));
```

That's all you need to get your web server up and running! 

### complex example

Here is an example of a web app with custom middleware, rate limit, mysql connection, and request body validation

```typescript
import {APIDescription, APIRouteType, DeadLock, RequestLocal} from "deadlockjs";
import {ObjectFilter, RegExpFilter, ValueTypeFilter} from "io-filter";

const api: APIDescription = {
    
    // 4 process will be spawn
    workers: 4,
    
    // authorize incoming requests from this url
    cors: {origin: "http://localhost:3000"},
    
    // port to listen to
    port: 3000,
    
    // Mysql pool configuration
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
    
    // list of forbidden ips
    ipBlacklist: [],
    
    // rate limit configuration
    rateLimit: {
        
        // these ips are not rate limited
        ipWhitelist: ['::1'],
        
        // default weight of a end-point
        weight: 10,
        
        // maximum number of pending requests
        maxPending: 0,
        
        // allowed weight per second
        // in this case a client can make up to 10 requests per second by default
        maxWeightPerSec: 100
    },
    
    // activates the cache system
    cache: {
        
        // default expiration time
        expire: 2000
    },
    
    // api basepath
    basePath: '/api/v1',
    
    // global middleware
    middleware: async (req: express.Request, res: express.Response) => {
        if (Math.random() < 0.5)
            throw new Error("Not allowed");
    },
    
    // routes
    routes: {
        
        // available on /api/v1/login
        '/login': {
            
            // route method
            method: 'post',
            
            // weight of this end-point
            rateLimit: {weight: 80},
            
            // POST data must be set and match this filter
            paramFilter: new ObjectFilter({
                pseudo: new RegExpFilter(/^[a-zA-Z0-9]{3,20}$/),
                password: new ValueTypeFilter('string')
            }),
            
            // is a mysql connection needed?
            db: {mysql: true},
            
            // set custom cache expiration time
            cache: {
                
                // to 1s
                expire: 1000
            },
            
            // request handler function
            handler: async (dl: RequestLocal) => {
                // dl.mysql -> MySQL Pool Connection
                // dl.requestInfo.params -> {pseudo: string, password: string}
                return {a: Math.random()};
            }
        }
    }
};

DeadLock
    .startApp(api)
    .then(() => console.log("Server started"));
```

Each worker will allocate a MySQL Pool with 'connectionLimit' connections.

