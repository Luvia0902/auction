import puppeteer from 'puppeteer';

async function testFirstBank() {
    console.log('啟動瀏覽器...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });

    const url = 'https://www.firstbank.com.tw/sites/fcb/1565687623134';
    console.log(`正在前往: ${url}`);

    page.on('response', async res => {
        if (res.url().includes('api') || res.url().includes('fcb') && res.request().method() === 'POST') {
            console.log('Intercepted API:', res.url(), res.status());
        }
    });

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        console.log('等待頁面載入...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log('嘗試列印清單...');
        const html = await page.evaluate(() => {
            const trs = Array.from(document.querySelectorAll('tr, .list-item'));
            return trs.map(tr => tr.textContent?.trim().replace(/\s+/g, ' ')).slice(0, 10);
        });
        console.log('找到的 TR/LI 內容前10筆:', html);

        const mainContent = await page.evaluate(() => {
            return document.querySelector('.main-content, main, #content, table')?.innerHTML.substring(0, 1000) || '無主要內容或表格';
        });
        console.log('主要內容片段:', mainContent);

    } catch (e: any) {
        console.error('發生錯誤:', e.message);
    } finally {
        await browser.close();
    }
}

testFirstBank();
