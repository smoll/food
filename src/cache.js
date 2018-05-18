const bluebird = require('bluebird')
const redis = require('redis')

bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

const client = (uri = null) => redis.createClient(uri || 'redis://redis:6379')

module.exports = client
