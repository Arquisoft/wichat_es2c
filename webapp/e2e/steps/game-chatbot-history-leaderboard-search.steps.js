const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const { testUser } = require("../user-config");
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

        try {
            await page.goto("http://localhost:3000/signup", { waitUntil: "networkidle0" });
            await page.type('input[name="username"]', testUser.username);
            await page.type('input[name="password"]', testUser.password);
            await page.click('button[type="submit"]');
            await page.waitForNavigation({ waitUntil: 'networkidle0' });
        } catch (error) {}

        await page.type('input[name="username"]', testUser.username);
        await page.type('input[name="password"]', testUser.password);
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
    });

    test('User plays a complete game', ({ given, when, then, and }) => {
        given('A registered user', async () => {
            await expect(page).toMatchElement('nav');
        });

        when('I click on Play button', async () => {
            await expect(page).toClick('a', { text: 'Play' });
            await page.waitForNavigation({ waitUntil: 'networkidle0' });
        });

        and('I select the Hard difficulty', async () => {
            const [hard] = await page.$x('/html/body/div[2]/div[3]/div[1]/button[2]/span/span');
            if (hard) await hard.click();
            const [mode] = await page.$x('/html/body/div[2]/div[3]/div[2]/div[3]');
            if (mode) await mode.click();
            const [play] = await page.$x('/html/body/div[2]/div[3]/button');
            if (play) await play.click();
        });

        and('I interact with the chatbot asking for hints', async () => {
            await page.waitForTimeout(3000);
            const message = "pista";
            const [chatButton] = await page.$x('//*[@id="chatCon"]/div[2]/p/img');
            await chatButton.click();
            await page.waitForTimeout(1000);
            const [chatInput] = await page.$x('//*[@id="chatCon"]/div[1]/div[3]/input');
            await chatInput.focus();
            await chatInput.type(message);
            await page.keyboard.press('Enter');
            await page.waitForXPath('//*[@id="chatCon"]/div[1]/div[2]/div[1]/div/p[3]', { timeout: 5000 });
        });


        and('I answer 5 questions by clicking on the first option each time', async () => {
            for (let i = 0; i < 6; i++) {
                const [button] = await page.$x('//*[@id="root"]/div/div[2]/div[2]/button[1]/span/span');
                if (button) await button.click();
                await sleep(1000);
            }
        });

        then('The game over modal appears', async () => {
            await page.waitForSelector('div[role="presentation"] h2', {
                visible: true,
                timeout: 90000,
            });

            const text = await page.evaluate(() => {
                const el = document.querySelector('div[role="presentation"] h2');
                return el ? el.textContent : '';
            });

            expect(text).toContain('¡Time is out!');

            const [closeButton] = await page.$x('//button[contains(., "Close") or contains(., "OK") or contains(., "Continue")]');
            if (closeButton) {
                await closeButton.click();
                await page.waitForTimeout(1000);
            }
        });
    });

    test('The user already logged in', ({ given, when, then }) => {
        given('A registered user', async () => {
            await page.goto("http://localhost:3000/home", { waitUntil: "networkidle0" });
        });

        when('I click on the view history button on the nav', async () => {
            await expect(page).toClick('a', { text: 'History' });
            await page.waitForNavigation({ waitUntil: 'networkidle0' });
        });

        then('My match history appears', async () => {
            await page.waitForTimeout(2000);
            await page.waitForXPath('//*[contains(text(), "Statistics")]');
            const games = await page.$x("//*[contains(text(),'Games played')]");
            expect(games.length).toBeGreaterThan(0);
        });
    });

    test('View global leaderboard rankings', ({ given, when, then }) => {
        given('A registered user is logged in', async () => {
            await expect(page).toMatchElement('nav');
        });

        when('I click on the leaderboard button in the navigation', async () => {
            await expect(page).toClick('a', { text: 'Leaderboard' });
            await page.waitForNavigation({ waitUntil: 'networkidle0' });
        });

        then('I should see the global leaderboard rankings', async () => {
            await page.waitForTimeout(2000);
            const scoreHeader = await page.$x('//h2[contains(text(), "Score Ranking")]');
            const activeHeader = await page.$x('//h2[contains(text(), "Most Active Players")]');
            expect(scoreHeader.length).toBeGreaterThan(0);
            expect(activeHeader.length).toBeGreaterThan(0);
        });
    });

    test("Search for a specific user's matches", ({ given, when, then }) => {
        given('I am on the leaderboard page', async () => {
            await page.goto("http://localhost:3000/leaderboard", { waitUntil: "networkidle0" });
            await page.waitForTimeout(2000);
        });

        when('I search for a specific username', async () => {
            await page.waitForSelector('.MuiAutocomplete-root', { visible: true });
            await page.click('.MuiAutocomplete-root .MuiOutlinedInput-root');
            await page.type('.MuiAutocomplete-root input', testUser.username);
            await sleep(1000);
            await page.keyboard.press('Enter');
            const searchButton = await page.$('.MuiButton-contained');
            if (searchButton) {
                await searchButton.click();
            }
            await sleep(1500);
        });

        then("I should see that user's match history", async () => {
            await page.waitForTimeout(3000);
            const pageContent = await page.content();
            expect(pageContent.includes("gameSummaryWrapper")).toBe(true);
        });
    });

    afterAll(async () => {
        await browser.close();
    });
});
