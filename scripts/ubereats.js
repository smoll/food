/* https://chrome.browserless.io/ */
const puppeteer = require('puppeteer');

(async() => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  // No need to require puppeteer or create a page
await page.goto('https://example.com');

  page.goto('https://www.ubereats.com')
  page.on('request', async request => {
    // request.resourceType() === 'xhr'
    // 'cookie' in Object.keys(request.headers()).map(key => key.toLowerCase())
    if (request.url().startsWith('https://www.ubereats.com/rtapi/eats/v1/bootstrap-eater')) {
      const method  = request.method() // string
      const url     = request.url() // string
      const body    = request.postData() // string
      const headers = request.headers() // Object

      const cookies = await page.cookies() // Array<Object>
      // console.log('cookies:', cookies)
      const cookieVal = cookies.map(c => `${c.name}=${c.value}`).join('; ')

      const info = Object.assign({}, {
        method,
        url,
        body,
        headers: {
          ...headers,
          'Cookie': cookieVal,
        },
      })
      console.log('request json:', info)
    }
  })

  const searchBox = '#address-selection-input'
  // Avoid Error: Protocol error (Runtime.evaluate): Cannot find context with specified id undefined
  await page.waitFor(searchBox)

  // WORKAROUND because uber does some weird DOM manipulation
  await page.type(searchBox, 'xxx xxxx xxxx xxxx')
  await page.waitFor(searchBox)

  // Type into search box
  await page.type(searchBox, '2928 Atlantic Ave') // prediction_

  // Wait for suggest overlay to appear and select first suggestion
  const firstSuggestion = '.prediction_ .locationTitle_'
  await page.waitForSelector(firstSuggestion)
  await page.click(firstSuggestion) // await page.keyboard.press('Enter')

  // Wait for the results page to load and display the results
  await page.waitForSelector('.details_')
  browser.close();
})();
