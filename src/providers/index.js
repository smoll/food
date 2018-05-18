const _ = require('lodash')
const fetch = require('node-fetch')
const parseAddress = require('parse-address')
const resemblance = require('resemblance')
const thirdParty = require('./third-party')
const {haversineDistance} = require('./utils')

const PROVIDERS = [
  'seamless',
  'doordash',
  'ubereats',
  'postmates',
]

const abbreviate = word => {
  const dict = {
    'Avenue': 'Ave',
    'Ave.': 'Ave',
    'Boulevard': 'Blvd',
    'Blvd.': 'Blvd',
    'Street': 'St',
    'St.': 'St',
  }
  return dict[word] || word
}

const cleanParsedAddress = address => Object.assign({}, address, {
  number: address.number.replace(/\D/g,''),
  street: address.street.toLowerCase(),
  type: abbreviate(address.type),
})

const compareAddresses = (first, second) => {
  if (!first || !second) return 0
  const parsed1 = parseAddress(first)
  const parsed2 = parseAddress(second)

  const clean1 = cleanParsedAddress(parse1)
  const clean2 = cleanParsedAddress(parse2)

  return resemblance.compareObjects(clean1, clean2, {number: 33, street: 34, type: 33})
}

const getRestaurants = async (lng, lat, debug) => {
  const requests = PROVIDERS.map(provider => thirdParty[provider](lng, lat, debug))
  const responses = await Promise.all(requests)

  // TODO: pass deep link
  const tagged = responses.map((response, i) => response.map(result => Object.assign(
    {},
    result,
    {
      providers: [PROVIDERS[i]],
      providerCount: 1,
    },
  )))

  const flattened = []
    .concat(...tagged)
    .map((result, index) => Object.assign(
      {},
      result,
      {id: index},
    ))

  const retVal = flattened.reduce((acc, curr) => {
    const match = _.values(acc).find(existing => {
      const nameScore = resemblance.compareStrings(existing.name, curr.name)
      const streetScore = compareAddresses(existing.street, curr.street)
      const distance = haversineDistance([existing.lat, existing.lng], [curr.lat, curr.lng])

      if (nameScore > 0.95 && streetScore > 0.99) {
        // console.log('[0] MATCHED on name + street', existing, curr, 'nameScore=', nameScore, 'streetScore=', streetScore)
        return true
      } else if (nameScore > 0.95 && distance < 0.015) {
        console.log('[1] MATCHED on name + distance', existing, curr, 'nameScore=', nameScore, 'streetScore=', streetScore, 'distance=', distance)
        return true
      }
      return false
    })
    if (match) {
      const providers = [...match.providers, ...curr.providers]
      acc[match.id] = {
        ...match,
        providers,
        providerCount: providers.length,
      }
    } else {
      acc[curr.id] = curr
    }
    return acc
  }, {})
  // console.log('combined json:', retVal)
  console.log('raw:', flattened.length)
  console.log('de-duped:', Object.keys(retVal).length)
  return retVal
}

module.exports = {
  getRestaurants,
}
