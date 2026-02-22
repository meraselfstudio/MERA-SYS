const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.error('PAGE ERROR:', error.message));
    page.on('requestfailed', request =>
        console.error(`REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`)
    );

    await page.goto('https://os.meraselfstudio.com', { waitUntil: 'networkidle2' });

    const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML);
    console.log("Root content length:", rootHtml?.length);

    await browser.close();
})();
