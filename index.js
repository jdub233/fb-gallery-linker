const puppeteer = require('puppeteer');
const fs = require('fs');
const commandLineArgs = require('command-line-args');
require('dotenv').load();
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
    
    // Handle cookies.
    if (fs.existsSync('./cookies')) {
        console.log('Import saved cookies');

        const cookies = JSON.parse(fs.readFileSync('./cookies', 'utf-8'));
        await page.setCookie(...cookies);
    }

    // Visit page.
    await page.goto(options.url, {
        waitUntil: 'networkidle2'
    });
    await page.setViewport({width: 1200, height: 1000});

    //  If login detected
    if (await page.$('input[name=email]') !== null) {
        console.log('Login form detected. Logging in...');

        await page.type('input[name=email]', process.env.FB_EMAIL, { delay: 100 });
        await page.type('input[name=pass]', process.env.FB_PASS, { delay: 100 });
        await page.click('#u_0_2');
        await page.waitForNavigation({
            waitUntil: 'load'
        });

        // Go to the gallery page again, because once you log in it goes to your home page.
        await page.goto(options.url, {
            waitUntil: 'networkidle2'
        });

        if (await page.$('input[name=email]') !== null) { // login failed
            return Promise.reject('Error: login failed');
        }
    }

    console.log('Write cookies to file...');
    fs.writeFileSync('./cookies', JSON.stringify(await page.cookies()), 'utf-8');

    await page.screenshot({
        fullPage: true,
        path: 'output/' + fbSetID + '.png'
    });

    await browser.close();
})();

