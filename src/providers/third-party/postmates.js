const cache = require('../../cache')
const logger = require('../../logger')
const fetch = require('node-fetch')
const launchBrowser = require('../launch-browser')
const queryString = require('query-string')

const CACHE_KEY = 'postmates'
const START_URL = 'https://postmates.com/_/defaults/location'
const ENDPOINT = 'https://postmates.com/food'
const COMMON_PARAMS = {
  client: 'customer.web',
  version: '3.0.0',
}

/**
 * Get restaurants from the provider
 * @param {number} lng
 * @param {number} lat
 * @returns {Object}
 */
const getRestaurants = async (lng, lat, debug = false) => {
  const commonQueryString = queryString.stringify(COMMON_PARAMS)
  const payload = {lat, lng}
  const headers = {
    'origin': 'https://postmates.com',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'en-US,en;q=0.9',
    'x-requested-with': 'XMLHttpRequest',
    // 'cookie': cookie,
    'pragma': 'no-cache',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
    'content-type': 'application/json',
    'accept': 'application/json, text/plain, */*',
    'cache-control': 'no-cache',
    'authority': 'postmates.com',
    'referer': 'https://postmates.com/',
  }
  const locateResponse = await fetch(`${START_URL}?${commonQueryString}`, {method: 'POST', headers, body: JSON.stringify(payload)})
  if (!locateResponse.ok) throw 'Invalid response from locate request!'

  const matches = locateResponse.headers.get('Set-Cookie').match(/([^,;\s]*sesh[^=]*)=([^,;\s]+)/)
  const cookie = `${matches[1]}=${matches[2]}`
  logger.info('cookie:', cookie)
  logger.info('token:', matches[2])

  const newHeaders = {
    'origin': 'https://postmates.com',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'en-US,en;q=0.9',
    'x-requested-with': 'XMLHttpRequest',
    'cookie': cookie,
    'content-length': '0',
    'pragma': 'no-cache',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
    'content-type': 'application/x-www-form-urlencoded',
    'accept': 'application/json, text/plain, */*',
    'cache-control': 'no-cache',
    'authority': 'postmates.com',
    'referer': 'https://postmates.com/food',
  }
  const url = `${ENDPOINT}?${commonQueryString}`

  const response = await fetch(url, {method: 'POST', headers: newHeaders})
  logger.info('response.status:', response.status)
  const json = await response.json()
  debug && require('fs-extra').writeJson(`./data/${CACHE_KEY}.json`, json, {spaces: 2})

  const stores = json.data.collection.items
  const transformed = stores
    .filter(s => !!s.name)
    .map(s => ({
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      street: s.street_address_1,
      city: s.city,
      state: s.state,
    }))
  return transformed
}

module.exports = {
  default: getRestaurants,
  getRestaurants,
}
