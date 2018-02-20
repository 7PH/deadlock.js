# DeadLockJS

TypeScript lightweight library for Node.js/Express - API management with automatic documentation generation

Still under development, not finished yet

### Features
- [X] Full API specification in a single object
- [X] Layer 7 DDoS mitigation 1 (request delaying)
- [ ] Layer 7 DDoS mitigation 2 (request caching)
- [X] MySQL pool management, dynamic release of connections
- [X] Request body data validation with io-filter
- [ ] Access token creation and validation
- [ ] Clustering
- [ ] Live statistics
- [ ] Automatic HTML Documentation generation

### Dependencies
This library uses io-filter to validate request body

@SEE https://github.com/7PH/io-filter