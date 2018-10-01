const puppeteer = require('puppeteer');
const fs = require('fs');
const commandLineArgs = require('command-line-args');
require('dotenv').load();
const url = require('url');


const optionDefinitions = [
  { name: 'url', alias: 'u', type: String },
];

const options = commandLineArgs(optionDefinitions);

// Setup constants here for markup dependent details that may change.
const screenshotDivSelector = '#fbTimelinePhotosFlexgrid';
const loginSubmitID = '#u_0_2';

// Get the set ID from the URL in order to provide a filename.
const myURL = new URL(options.url);
const fbSetID = myURL.searchParams.get('set');

if (null === fbSetID) {
  console.log('No set ID found');
  process.exit(1);
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Handle cookies.
  if (fs.existsSync('./cookies')) {
    console.log('Import saved cookies');

    const cookies = JSON.parse(fs.readFileSync('./cookies', 'utf-8'));
    await page.setCookie(...cookies);
  }

  // Visit page.
  await page.goto(options.url, {
    waitUntil: 'networkidle2',
  });
  await page.setViewport({ width: 1200, height: 1000 });

  //  If login detected
  if (await page.$('input[name=email]') !== null) {
    console.log('Login form detected. Logging in...');

    await page.type('input[name=email]', process.env.FB_EMAIL, { delay: 100 });
    await page.type('input[name=pass]', process.env.FB_PASS, { delay: 100 });
    await page.click(loginSubmitID);
    await page.waitForNavigation({
      waitUntil: 'load',
    });

    // Go to the gallery page again, because once you log in it goes to your home page.
    await page.goto(options.url, {
      waitUntil: 'networkidle2',
    });

    if (await page.$('input[name=email]') !== null) { // login failed
      return Promise.reject('Error: login failed');
    }
  }

  console.log('Write cookies to file...');
  fs.writeFileSync('./cookies', JSON.stringify(await page.cookies()), 'utf-8');

  await screenshotDOMElement(page, {
    path: 'output/' + fbSetID + '.png',
    selector: screenshotDivSelector,
    padding: 2,
    magicOffset: 357,
  });

  await browser.close();
})();


/**
 * Takes a screenshot of a DOM element on the page, with optional padding.
 *
 * magicOffset is a number of pixels to offset the div,
 * for some reason this works with chromium and the current layout.
 *
 * @param page
 * @param {!{path:string, selector:string, padding:(number|undefined), magicOffset:number}=} opts
 * @return {!Promise<!Buffer>}
 */
async function screenshotDOMElement(page, opts = {}) {
  const padding = 'padding' in opts ? opts.padding : 0;
  const path = 'path' in opts ? opts.path : null;
  const selector = opts.selector;
  const magicOffset = opts.magicOffset;

  if (!selector) {
    throw Error('Please provide a selector.');
  }


  const rect = await page.evaluate(selector => {
    const element = document.querySelector(selector);
    if (!element)
      return null;
    const { x, y, width, height } = element.getBoundingClientRect();
    return { left: x, top: y, width, height, id: element.id };
  }, selector);

  if (!rect)
    throw Error(`Could not find element that matches selector: ${selector}.`);

  return await page.screenshot({
    path,
    clip: {
      x: rect.left - padding,
      y: rect.top - padding + magicOffset,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    },
  });
}
