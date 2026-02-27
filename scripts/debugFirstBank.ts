import puppeteer from 'puppeteer';

async function run() {
    console.log('Starting Next-Gen Debugger for FirstBank...');
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    page.on('response', async (res) => {
        const type = res.request().resourceType();
        if (type === 'xhr' || type === 'fetch' || type === 'document') {
            const url = res.url();
            console.log(`[${type}] ${url}`);

            // 如果看起來很像是目標 API
            if (url.includes('foreclosure') || url.includes('House') || url.includes('house') || url.includes('data') || url.includes('query')) {
                try {
                    const text = await res.text();
                    console.log(`\n=== 疑似目標資料來源 (${url}) ===\n> 長度: ${text.length}\n> Preview: ${text.substring(0, 300)}\n=================================\n`);
                } catch (e) { }
            }
        }
    });

    try {
        console.log('Navigating to first bank foreclosure page (iframe source)...');
        await page.goto('https://firstbank.map.com.tw/Search_Engine/foreclose_house.asp', { waitUntil: 'domcontentloaded', timeout: 30000 });

        console.log('Waiting 2 secs...');
        await new Promise(r => setTimeout(r, 2000));

        console.log('Clicking the search button to see XHR req...');
        // The image shows a button "清單顯示" which might be submit or a specific button
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('input[type="button"], input[type="submit"], button'));
            const targetBtn = btns.find(b => b.value === '清單顯示' || b.textContent?.includes('清單顯示')) || btns[0];
            if (targetBtn) (targetBtn as HTMLElement).click();
        });

        await new Promise(r => setTimeout(r, 5000));


        const iframes = page.frames();
        console.log('Frames on page:', iframes.map(f => f.url()));

    } catch (e: any) {
        console.error('Goto error:', e.message);
    } finally {
        await browser.close();
    }
}
run();
