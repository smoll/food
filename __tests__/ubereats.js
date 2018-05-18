const ubereats = require('../src/providers/third-party/ubereats')
jest.mock('../src/cache');
jest.setTimeout(30000); // 10 second timeout

const {getRestaurants} = ubereats

test('executes successfully', async () => {
  const lng = -73.99
  const lat = 40.70

  const result = await getRestaurants(lng, lat)
  expect(result.feed.feedItems.length).toBeGreaterThan(5)
  // expect(result.meta.targetLocation.latitude).toEqual(lat)
  // expect(result.meta.targetLocation.longitude).toEqual(lng)
  // expect(result.marketplace.feed).toEqual({foo:'bar'})
});
