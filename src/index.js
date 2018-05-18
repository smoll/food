const express = require('express')
const {getRestaurants} = require('./providers')
const logger = require('./logger')

const {PORT = 3000} = process.env
const app = express()

app.get('/', function(request, response) {
  response.send('Hello World from Express!')
})

app.get('/crawl', async (request, response) => {
  logger.info('request.query', request.query)
  const {lng = '-73.981763', lat = '40.745851', debug = ''} = request.query

  try {
    const json = await getRestaurants(Number(lng), Number(lat), !!debug)
    response.setHeader('Content-Type', 'application/json')
    response.send(JSON.stringify(json))
  } catch(err) {
    logger.error(err)
    response.send('error :(')
  }
})

console.log('listening on %s 🔥', PORT)
app.listen(PORT)
