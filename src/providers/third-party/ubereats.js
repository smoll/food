const cache = require('../../cache')
const logger = require('../../logger')
const fetch = require('node-fetch')
const launchBrowser = require('../launch-browser')
const _ = require('lodash')
const jp = require('jsonpath')

const CACHE_KEY = 'ubereats'
const START_URL = 'https://www.ubereats.com/'
const ENDPOINT = 'https://www.ubereats.com/rtapi/eats/v1/allstores'
const LIMIT = 100

/**
 * Returns all properties needed to make an authed fetch request
 * @returns {Object}
 */
const initRequest = async () => {
  const headers = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Connection': 'keep-alive',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
  }
  const response = await fetch('https://www.ubereats.com/', {method: 'GET', headers})
  logger.info('initRequest response.url:', response.url)
  logger.info('initRequest response.status:', response.status)
  logger.info('response.headers:', response.headers)
  logger.info('token:', response.headers.get('x-csrf-token'))
  logger.info('set-cookies:', response.headers.get('Set-Cookie'))

  const matches = response.headers.get('Set-Cookie').match(/([^,;\s]*sess[^=]*)=([^,;\s]+)/)
  const cookie = `${matches[1]}=${matches[2]}`
  logger.info('cookie:', cookie)
  // logger.info('response.json()', await response.json())

  const newHeaders = {
    'Cookie': cookie,
    'x-csrf-token': response.headers.get('x-csrf-token'),
    'Pragma': 'no-cache',
    'Origin': 'https://www.ubereats.com',
    'Accept-Encoding': 'gzip, deflate, br',
    'accept-language': 'en-US',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
    'content-type': 'application/json',
    'Accept': '*/*',
    'Cache-Control': 'no-cache',
    'Referer': 'https://www.ubereats.com/',
    'Connection': 'keep-alive',
  }

  return {
    headers: newHeaders
  }
}

/**
 * Get restaurants from the provider
 * @param {number} lng
 * @param {number} lat
 * @returns {Object}
 */
const getRestaurants = async (lng, lat, debug = false) => {
  const payload = {targetLocation: {latitude: lat, longitude: lng}}
  const cached = cache() && await cache().getAsync(CACHE_KEY)
  const initOpts = cached ? JSON.parse(cached) : await initRequest()
  // logger.info('initOpts', initOpts)
  logger.info('cached', cached)

  const body = {
    "targetLocation":{
      "latitude":40.67725789999999,
      "longitude":-73.88628229999999,
      // "reference":"ChIJVXiogbRdwokR9Z7FmoJGVtI",
      // "type":"google_places",
      // "address":{"title":"2928 Atlantic Ave","address1":"2928 Atlantic Ave, Brooklyn"}
    },
    "feed":"combo",
    "feedTypes":["STORE","SEE_ALL_STORES"],
    "feedVersion":2,
    "pageInfo":{
        "offset":0,
        "pageSize":LIMIT,
    },
  }
  const newBody = JSON.stringify(_.merge(body, payload))
  const options = {...initOpts, method: 'POST', body: newBody}

  const response = await fetch(ENDPOINT, options)
  logger.info('getRestaurants response.status:', response.status)
  const json = await response.json()
  debug && require('fs-extra').writeJson(`./data/${CACHE_KEY}.json`, json, {spaces: 2})
  // logger.info('response json:', json)

  const feedItems = jp.query(json, '$.feed.feedItems.*')
  const storesMap = jp.query(json, '$.feed.storesMap.*')
  const stores = _.values(_.merge(
    _.keyBy(feedItems, 'uuid'),
    _.keyBy(storesMap, 'uuid')
  ))
  const transformed = stores
    .map(s => ({
      name: s.title.replace(/\s?-.*/g, ''),
      lat: s.location.latitude,
      lng: s.location.longitude,
      street: s.location.address.address1,
      city: s.location.address.city,
      state: s.location.address.region,
    }))
  return transformed
}

module.exports = {
  default: getRestaurants,
  initRequest,
  getRestaurants,
}
