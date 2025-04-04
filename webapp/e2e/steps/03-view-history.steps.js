const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const feature = loadFeature('./features/view-history.feature');

let page;
let browser;
defineFeature(feature, test => {

    beforeAll(async () => {
        browser = await puppeteer.launch({ headless: false, slowMo: 100 });
        page = await browser.newPage();
        setDefaultOptions({ timeout: 10000 });
        await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    });

    test('The user already logged in', ({ given, when, then }) => {
        given('A registered user', async () => {
            await expect(page).toMatchElement('nav');
        });

        when('I click on the view history button on the nav', async () => {
            await expect(page).toClick('a', { text: 'History' });
            await page.waitForNavigation({ waitUntil: 'networkidle0' });
        });

        then('My match history appears', async () => {
            await page.waitForXPath('//*[contains(text(), "Statistics")]')
            const hasGames = await page.$x("//*[contains(text(),'Games played')]");
            const noGamesMsg = await page.$x("//*[contains(text(),'There are no matches')]");

            //expect(hasGames.length > 0 || noGamesMsg.length > 0).toBe(true);
        });
    });

    afterAll(async () => {
        await browser.close();
    });


});