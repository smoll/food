const _ = require('lodash')
const jp = require('jsonpath')
const data = require('./doordash.json')

const stores = data.stores

const titles = jp.query(data, '$.stores[*].name')
console.log('titles', titles)

const transformed = stores.map(s => ({
  name: s.name,
  lat: s.address.lat,
  lng: s.address.lng,
}))

console.log('transformed',transformed)
console.log('length', transformed.length)
