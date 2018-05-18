const _ = require('lodash')
const jp = require('jsonpath')
const data = require('./seamless.json')

const stores = data.search_result.results

const titles = jp.query(data, '$.search_result.results[*].name')
console.log('titles', titles)

console.log(Object.keys(stores[0].address))

const transformed = stores
  .map(s => ({
    name: s.name,
    lat: s.address.latitude,
    lng: s.address.longitude,
  }))

console.log('transformed',transformed)
console.log('length', transformed.length)
