const puppeteer = require('puppeteer');
const commandLineArgs = require('command-line-args');
const url = require('url');


const optionDefinitions = [
    { name: 'url', alias: 'u', type: String }
];

const options = commandLineArgs(optionDefinitions);

// Get the set ID from the URL in order to provide a filename.
const myURL = new URL(options.url);
const fbSetID = myURL.searchParams.get('set');

if(null === fbSetID) {
    console.log('No set ID found');
    process.exit(1);
}

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(options.url);
    await page.setViewport({width: 500, height: 500});
    await page.screenshot({path: 'output/' + fbSetID + '.png'});

    await browser.close();
})();

