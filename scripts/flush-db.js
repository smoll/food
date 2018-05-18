const cache = require('../src/cache')

cache('redis://localhost:6383').flushdbAsync()
  .then(r => console.log(r))
  .then(() => process.exit(0))
