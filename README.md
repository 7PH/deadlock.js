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
- [ ] logs
- [ ] internal statistics (hits, execution time)
- [ ] internal api (retrieve stats, dynamically change route, ip blacklist/whitelist, etc)

## examples
### hello world
Here is a simple working example
```javascript

const DeadLockJS = require('deadlockjs').DeadLockJS;

const api = {
    routes: {
        '/': async () => "Hello World"
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

## model helper
If you have an object oriented model, it is likely that at some point you want to output an object but hide some private properties (e.g. password field for an User instance).
You may also want to make mysql select requests and retrieve instances of your model instead of raw objects.

You can do that easily by extending the `JSONExportable` class and by defining a `fields` attribute which contains the public fields to be sent to the client. If every field is public, it should be set to `*`.

From the client, you can retrieve your instance by using the `import` method.

Here is an example of how you can define a `User` object in your model

```typescript
export interface IUser {
    id: number;
    email: string;
    password?: string;
}

export class User extends JSONExportable implements IUser {
    
    // public fields
    fields: string[] | '*' = ['email'];
    
    id: number = 0;
    email: string = '';
    password?: string;
    
    constructor(data: IUser) {
        super();
        this.import(data);
    }
}
```

When you send `JSONExportable` instances to the client, private properties (not included in fields) are automatically removed.

You just have to extend the `JSONExportable` class and define the `fields`

if you are using mysql, you can use the `MySQL` helper class to make a request which directly returns instances of your model.

We suppose you have a `users` table which contains (id, email, password).

You can use:

```typescript
// mysql: mysql.Connection
// User: user class defined in the previous code section
const users: User[] = await MySQL.query<User>(mysql, `SELECT id, email, password FROM users`, User);
```

In order to use this syntax, the `User` class has to have a constructor which calls the `import` method from the `JSONExportable` superclass.
