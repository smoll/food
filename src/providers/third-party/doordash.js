const cache = require('../../cache')
const logger = require('../../logger')
const fetch = require('node-fetch')
const launchBrowser = require('../launch-browser')
const queryString = require('query-string')

const CACHE_KEY = 'doordash'
const START_URL = 'https://www.doordash.com/'
const ENDPOINT = 'https://api.doordash.com/v2/store_search/'
const DEFAULT_PARAMS = {
  offset: 0,
  limit: 100, // LIMIT
  suggest_mode: true,
  search_items: true,
  extra: 'stores.address',
}

/**
 * Returns all properties needed to make an authed fetch request, or rejects in 10 seconds
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
  const response = await fetch(START_URL, {method: 'GET', headers})
  if (!response.ok) throw 'Invalid response from initRequest!'

  const matches = response.headers.get('Set-Cookie').match(/([^,;\s]*csrf[^=]*)=([^,;\s]+)/)
  const cookie = `${matches[1]}=${matches[2]}`
  logger.info('cookie:', cookie)
  logger.info('token:', matches[2])
  // logger.info('response.json()', await response.json())

  const newHeaders = {
    'Cookie': cookie,
    'X-CSRFToken': matches[2],
    'Pragma': 'no-cache',
    'Origin': 'https://www.doordash.com',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Client-Version': 'web version 2.0',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache',
    'Referer': 'https://www.doordash.com/',
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
  const payload = {lat, lng}
  const cached = cache() && await cache().getAsync(CACHE_KEY)
  const initOpts = cached ? JSON.parse(cached) : await initRequest()
  // logger.info('initOpts', initOpts)
  logger.info('cached', cached)

  const {url, ...options} = initOpts
  const parsed = queryString.parseUrl(ENDPOINT)
  logger.info('parsed=', parsed)
  const qs = queryString.stringify({...DEFAULT_PARAMS, ...payload})
  const newUrl = `${parsed.url}?${qs}`
  logger.info('newUrl=', newUrl)

  const response = await fetch(newUrl, options)
  logger.info('response.status:', response.status)
  const json = await response.json()
  debug && require('fs-extra').writeJson(`./data/${CACHE_KEY}.json`, json, {spaces: 2})

  const stores = json.stores
  const transformed = stores.map(s => ({
    name: s.name,
    lat: s.address.lat,
    lng: s.address.lng,
    street: s.address.street,
    city: s.address.city,
    state: s.address.state,
  }))
  return transformed
}

module.exports = {
  default: getRestaurants,
  initRequest,
  getRestaurants,
}
