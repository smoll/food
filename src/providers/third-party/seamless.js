const cache = require('../../cache')
const logger = require('../../logger')
const fetch = require('node-fetch')
const launchBrowser = require('../launch-browser')
const queryString = require('query-string')

const CACHE_KEY = 'seamless'
const START_URL = 'https://api-gtm.grubhub.com/auth' // POST
const ENDPOINT = 'https://api-gtm.grubhub.com/restaurants/search' // GET
const DEFAULT_HEADERS = {
  'Pragma': 'no-cache',
  'Origin': 'https://www.seamless.com',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36',
  'Content-Type': 'application/json',
  'Accept': 'application/json, text/plain, */*',
  'Cache-Control': 'no-cache',
  'Referer': 'https://www.seamless.com',
  'Connection': 'keep-alive',
}
const LIMIT = 100

/* Returns a random n-digit number */
const digits = n => {
  const max = 10**(n-1)
  const min = 10**n -1
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Returns all properties needed to make an authed fetch request, or rejects in 10 seconds
 * @returns {Object}
 */
const initRequest = async () => {
  const payload = {
    "brand":"SEAMLESS",
    "client_id":"beta_seamless_ayNyuFxxVQYefSAhFYCryvXBPQc",
    "device_id":digits(10),
    "scope":"anonymous"
  }
  const response = await fetch(START_URL, {method: 'POST', headers: {...DEFAULT_HEADERS}, body: JSON.stringify(payload)})
  if (!response.ok) throw 'Invalid response from initRequest!'
  const json = await response.json()
  const token = json.session_handle.access_token

  const res = {
    headers: {
      ...DEFAULT_HEADERS,
      'Authorization': `Bearer ${token}`,
      'If-Modified-Since': '0',
    }
  }

  cache() && await cache().setAsync(CACHE_KEY, JSON.stringify(res))

  return res
}

/**
 * Get restaurants from the provider
 * @param {number} lng
 * @param {number} lat
 * @returns {Object}
 */
const getRestaurants = async (lng, lat, debug = false) => {
  const point = `POINT(${lng} ${lat})`
  const payload = {
    'orderMethod': 'delivery',
    'locationMode': 'DELIVERY',
    'facetSet': 'umamiV2',
    'pageSize': LIMIT,
    'hideHateos': 'true',
    'searchMetrics': 'true',
    // 'queryText': 'pizza', // search by cuisine
    'location': point,
    'facet': 'open_now:true',
    'variationId': 'imUseDefaultForPickup',
    // 'fieldSet': 'cuisine', // search by cuisine
    'sortSetId': 'umamiV2', // previously: umamiV2_imGhostChili
    'sponsoredSize': '2',
    'countOmittingTimes': 'true',
  }
  const cached = cache() && await cache().getAsync(CACHE_KEY)
  let initOpts = cached ? JSON.parse(cached) : await initRequest()
  // logger.info('initOpts', initOpts)
  logger.info('cached', cached)

  const parsed = queryString.parseUrl(ENDPOINT)
  logger.info('parsed=', parsed)
  const qs = queryString.stringify(payload)
  const newUrl = `${parsed.url}?${qs}`
  logger.info('newUrl=', newUrl)

  let response = await fetch(newUrl, initOpts)
  logger.info('response.status:', response.status)

  if (!response.ok) {
    initOpts = await initRequest()
    response = await fetch(newUrl, initOpts)
  }

  const json = await response.json()
  debug && require('fs-extra').writeJson(`./data/${CACHE_KEY}.json`, json, {spaces: 2})

  const stores = json.search_result.results
  const transformed = stores
    .map(s => ({
      name: s.name,
      lat: Number(s.address.latitude),
      lng: Number(s.address.longitude),
      street: s.address.street_address,
      city: s.address.address_locality,
      state: s.address.address_region,
    }))
  return transformed
}

module.exports = {
  default: getRestaurants,
  initRequest,
  getRestaurants,
}
