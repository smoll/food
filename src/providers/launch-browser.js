const puppeteer = require('puppeteer')

const getChromePath = require('@browserless/aws-lambda-chrome')({
  path: '/tmp'
})

const isCI = !!process.env.CI
const isDebug = !!process.env.DEBUG_BROWSER
const isLambda = !!process.env.LAMBDA_TASK_ROOT

module.exports = async () => {
  const defaultOpts = {
    ignoreHTTPSErrors: true,
  }
  const debugOpts = {
    headless: isCI,
    slowMo: 10 // slow down by this many ms
  }
  const lambdaOpts = {
    args: [
      '--disable-gpu',
      '--single-process', // Currently wont work without this :-(
      '--no-zygote', // helps avoid zombies
      '--no-sandbox',
      '--hide-scrollbars'
    ],
    executablePath: await getChromePath(),
  }
  const opts = {
    ...defaultOpts,
    ...(isDebug ? debugOpts : {}),
    ...(isLambda ? lambdaOpts : {}),
  }
  console.log('opts', opts)
  return puppeteer.launch(opts)
}
