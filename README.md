# DeadLockJS

TypeScript lightweight library for Node.js/Express - API management with automatic documentation generation

Still under development, not finished yet

### Features
- [X] Full API specification in a single object
- [X] Layer 7 DDoS mitigation (delay and drop)
- [X] ~~Request caching~~ Made into another library: PromiseCaching
- [X] MySQL pool management, dynamic release of connections
- [X] Request body validation and filtering
- [ ] Clustering
- [ ] Live statistics
- [ ] Automatic HTML Documentation generation

### Dependencies
This library uses io-filter to validate request body

@SEE https://github.com/7PH/io-filter

### Example

Here is a simple working example, without database connection and ddos protection:
```typescript

import {APIDescription, APIRouteType, DeadLockJS} from "deadlockjs";
import * as express from 'express';

const api: APIDescription = {
    appSecret: '1f4600bc0380273f90ed02db217cfbf',
    port: 3000,
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
```

That's it! 


### See also
I made another library to handle caching promises

@SEE https://github.com/7PH/Promise-Caching