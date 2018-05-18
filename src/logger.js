var bunyan = require("bunyan")

bunyan.defaultStreams = [
  {
    level: 'info',
    stream: process.stdout
  }
]

const logger = bunyan.createLogger({
  name: 'unwrapped',
  level: 'info',
  src: true,
})

module.exports = logger
