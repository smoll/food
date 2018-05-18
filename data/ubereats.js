const _ = require('lodash')
const jp = require('jsonpath')
const data = require('./ubereats.json')

const feedItems = jp.query(data, '$.feed.feedItems.*')
const storesMap = jp.query(data, '$.feed.storesMap.*')

console.log('feedItems', feedItems.length)
console.log('storesMap', storesMap.length)

const stores = _.values(_.merge(
  _.keyBy(feedItems, 'uuid'),
  _.keyBy(storesMap, 'uuid')
))

// console.log('combined', combined[0])

const titles = jp.query(data, '$.marketplace.feed.feedItems[*].parentChainDeprecated')
console.log('titles', titles)

const transformed = stores
  .map(s => ({
    name: s.title,
    lat: s.location.latitude,
    lng: s.location.longitude,
  }))

console.log(transformed)
console.log('length', transformed.length)
