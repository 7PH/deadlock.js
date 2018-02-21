# DeadLockJS

TypeScript lightweight library for Node.js/Express - API management with automatic documentation generation

Still under development, not finished yet

### Features
- [X] Full API specification in a single object
- [X] Layer 7 DDoS mitigation (delay and drop)
- [X] ~~Request caching~~ Made into another library: PromiseCaching
- [X] MySQL pool management, dynamic release of connections
- [X] Request body validation and filtering
- [ ] Access token creation and validation
- [ ] Clustering
- [ ] Live statistics
- [ ] Automatic HTML Documentation generation

### Dependencies
This library uses io-filter to validate request body

@SEE https://github.com/7PH/io-filter

### See also
I made another library to handle caching promises

@SEE https://github.com/7PH/Promise-Caching