const timeoutPromise = (ms, promise) => {
  // Create a promise that rejects in <ms> milliseconds
  let timeout = new Promise((resolve, reject) => {
    let id = setTimeout(() => {
      clearTimeout(id)
      reject(`Timed out in ${ms} ms.`)
    }, ms)
  })

  // Returns a race between our timeout and the passed in promise
  return Promise.race([
    promise,
    timeout
  ])
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Calculates the haversine distance between point A, and B.
 * @param {number[]} latlngA [lat, lng] point A
 * @param {number[]} latlngB [lat, lng] point B
 * @param {boolean} isMiles If we are using miles, else km.
 */
const haversineDistance = (latlngA, latlngB, isMiles = true) => {
  const toRad = x => (x * Math.PI) / 180
  const R = 6371 // km

  const dLat = toRad(latlngB[1] - latlngA[1])
  const dLatSin = Math.sin(dLat / 2)
  const dLon = toRad(latlngB[0] - latlngA[0])
  const dLonSin = Math.sin(dLon / 2)

  const a = (dLatSin * dLatSin) +
            (Math.cos(toRad(latlngA[1])) * Math.cos(toRad(latlngB[1])) * dLonSin * dLonSin)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  let distance = R * c

  if (isMiles) distance /= 1.60934

  return distance
}

module.exports = {
  sleep,
  timeoutPromise,
  haversineDistance,
}
