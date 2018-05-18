const _ = require('lodash')
const jp = require('jsonpath')
const data = require('./postmates.json')

const stores = data.data.collection.items

const titles = jp.query(data, '$.data.collection.items[*].name')
console.log('titles', titles) // TODO: remove '' titles

// console.log(Object.keys(stores[0]))

const transformed = stores
  .filter(s => !!s.name)
  .map(s => ({
    name: s.name,
    lat: s.lat,
    lng: s.lng,
  }))

console.log('transformed',transformed)
console.log('length', transformed.length)
