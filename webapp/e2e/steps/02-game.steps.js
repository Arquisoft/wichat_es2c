const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const {testUser} = require("../user-config");
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const feature = loadFeature('./features/game.feature');

let page;
let browser;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

defineFeature(feature, test => {
    beforeAll(async () => {
        browser = await puppeteer.launch({ headless: false, slowMo: 100 });
        page = await browser.newPage();
        setDefaultOptions({ timeout: 10000 });
        await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });

        await page.goto("http://localhost:3000/signup", { waitUntil: "networkidle0" });
        await page.type('input[name="username"]', testUser.username);
        await page.type('input[name="password"]', testUser.password);
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });


        await page.type('input[name="username"]', testUser.username);
        await page.type('input[name="password"]', testUser.password);
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
    });

    test('User plays a complete game', ({ given, when, then, and }) => {
        given('A registered user', async () => {

        });

        when('I click on Play button', async () => {
            await expect(page).toClick('a', { text: 'Play' });
            await page.waitForNavigation({ waitUntil: 'networkidle0' });
        });


        and('I select the hard difficulty', async () => {
            const [hard] = await page.$x('/html/body/div[2]/div[3]/div[1]/button[2]/span/span');
            if (hard) {
                await hard.click();
            }
            const [mode] = await page.$x('/html/body/div[2]/div[3]/div[2]/div[3]');
            if (mode) {
                await mode.click();
            }
            const [play] = await page.$x('/html/body/div[2]/div[3]/button');
            if (play) {
                await play.click();
            }
        });

        and('I answer 5 questions by clicking on the first option each time', async () => {
            const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

            for (let i = 0; i < 6; i++) {
                const [button] = await page.$x('//*[@id="root"]/div/div[2]/div[2]/button[1]/span/span'); //cambiar luego
                if (button) {
                    await button.click();
                }

                await sleep(1000);
            }
        });


        then('The game over modal appears', async () => {
            await page.waitForSelector('div[role="presentation"] h2', {
                visible: true,
                timeout: 90000,
            });

            const gameOverText = await page.evaluate(() => {
                const modalContent = document.querySelector('div[role="presentation"] h2');
                return modalContent ? modalContent.textContent : '';
            });

            expect(gameOverText).toContain('¡Time is out!');
        });
    });

    afterAll(async () => {
        await browser.close();
    });
});