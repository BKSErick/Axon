const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
        page.on('pageerror', error => console.error('BROWSER ERROR:', error.message));
        page.on('requestfailed', request => {
            console.error('REQUEST FAILED:', request.url(), request.failure().errorText);
        });

        console.log("Navigating to http://localhost:5173/");
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 10000 });
        
        console.log("Waiting 3s for React to mount...");
        await new Promise(r => setTimeout(r, 3000));
        
        const bodyHtml = await page.evaluate(() => document.body.innerHTML.substring(0, 100));
        console.log("BODY HTML:", bodyHtml);

        await browser.close();
    } catch (e) {
        console.error("SCRIPT ERROR:", e);
        process.exit(1);
    }
})();
