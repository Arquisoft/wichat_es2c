const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const {testUser} = require("../user-config");
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const feature = loadFeature('./features/game.feature');
const leaderboardFeature = loadFeature('./features/view-leaderboard.feature');

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
            await expect(page).toClick('a', {text: 'Play'});
            await page.waitForNavigation({waitUntil: 'networkidle0'});
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

    defineFeature(leaderboardFeature, test => {
        test('View global leaderboard rankings', ({given, when, then}) => {
            given('A registered user is logged in', async () => {
                await expect(page).toMatchElement('nav');
            });

            when('I click on the leaderboard button in the navigation', async () => {
                await page.goto("http://localhost:3000/home", {waitUntil: "networkidle0"});
                await expect(page).toClick('a', {text: 'Leaderboard'});
                await page.waitForNavigation({waitUntil: 'networkidle0'});
            });

            then('I should see the global leaderboard rankings', async () => {
                await page.waitForTimeout(2000);

                const scoreRankingHeader = await page.$x('//h2[contains(text(), "Score Ranking")]');
                expect(scoreRankingHeader.length).toBeGreaterThan(0);

                const activePlayersHeader = await page.$x('//h2[contains(text(), "Most Active Players")]');
                expect(activePlayersHeader.length).toBeGreaterThan(0);

            });
        });

        test('Search for a specific user\'s matches', ({given, when, then}) => {
            given('I am on the leaderboard page', async () => {
                await page.goto("http://localhost:3000/leaderboard", {waitUntil: "networkidle0"});
                await page.waitForTimeout(2000);
            });

            when('I search for a specific username', async () => {
                await page.waitForTimeout(1000);

                try {
                    const searchInput = await page.$('input[type="text"]');
                    await searchInput.click();
                    await searchInput.type(testUser.username);
                    await page.waitForTimeout(500);

                    const suggestion = await page.$('li[role="option"]');
                    if (suggestion) {
                        await suggestion.click();
                    }

                    const searchButton = await page.$x('//button[contains(., "Search") or contains(., "search")]');
                    if (searchButton.length > 0) {
                        await searchButton[0].click();
                    }

                    await page.waitForTimeout(2000);
                } catch (e) {
                    console.error('Error during search:', e);
                    await page.screenshot({path: 'search-error.png'});
                }
            });

            then('I should see that user\'s match history', async () => {
                await page.waitForTimeout(2000);

                const gameSummaries = await page.$x('//div[contains(@class, "gameSummary")]');
                const noMatchesMsg = await page.$x('//div[contains(text(), "no matches") or contains(text(), "No matches")]');

                expect(gameSummaries.length > 0 || noMatchesMsg.length > 0).toBe(true);

                console.log(`Found ${gameSummaries.length} game summaries`);
            });
        });
    });
    afterAll(async () => {
        await browser.close();
    });
});