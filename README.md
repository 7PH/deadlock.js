# deadlock.js
Lightweight Node.js/Express framework written in TypeScript for building secured, clustered and well-designed APIs.


## install
The easiest way to install deadlockjs is with [`npm`][npm].

[npm]: https://www.npmjs.com/

```sh
npm i --save deadlockjs
```

## features
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

## examples

### hello World
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

### complex example

Here is an example of a web app with custom middleware, rate limit, mysql connection, and request body validation

```typescript
import {APIDescription, APIRouteType, DeadLockJS, RequestLocal} from "deadlockjs";
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

DeadLockJS
    .startApp(api)
    .then(() => console.log("Server started"));
```

Each worker will allocate a MySQL Pool with 'connectionLimit' connections.
