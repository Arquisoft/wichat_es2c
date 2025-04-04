const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const feature = loadFeature('./features/game.feature');

let page;
let browser;

// Función auxiliar para esperar un tiempo específico
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

defineFeature(feature, test => {
    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: false,
            slowMo: 100,
            defaultViewport: null,
            args: ['--start-maximized']
        });
        page = await browser.newPage();
        setDefaultOptions({ timeout: 15000 });
        await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    });

    test('User plays a complete game', ({ given, when, then, and }) => {
        given('A registered user', async () => {

        });

        when('I click on Play button', async () => {
            await expect(page).toClick('a', { text: 'Play' });
            await page.waitForNavigation({ waitUntil: 'networkidle0' });
        });

        then('The difficulty selection modal appears', async () => {
            await page.waitForSelector('h1.winnerTitle', { visible: true });
            const modalTitle = await page.$eval('h1.winnerTitle', el => el.textContent);
            expect(modalTitle).toContain('Select difficulty level');
        });

        and('I select the Normal difficulty', async () => {
            const button = await page.$('div.awesome-button-class');
            await button.click();
            await page.waitForSelector('.questionContainer', { visible: true });
        });

        and('I answer 5 questions by clicking on the first option each time', async () => {
            for (let i = 0; i < 5; i++) {
                await page.waitForSelector('.optionsGrid button', { visible: true });

                const questionText = await page.$eval('.questionContainer', el => el.textContent);
                console.log(`Pregunta ${i+1}: ${questionText.substring(0, 50)}...`);

                await page.screenshot({ path: `question-${i+1}.png` });

                const buttons = await page.$$('.optionsGrid button');
                await buttons[0].click();

                await sleep(1500);
            }
        });

        and('I wait until the timer runs out', async () => {
            console.log('Esperando a que el tiempo se agote...');
            await page.waitForSelector('.showTimeOutModal', { visible: true, timeout: 65000 })
                .catch(async () => {
                    await sleep(10000);
                });
        });

        then('The game over modal appears', async () => {
            const gameOverText = await page.evaluate(() => {
                const modalContent = document.querySelector('body > div[role="presentation"] h2');
                return modalContent ? modalContent.textContent : '';
            });

            expect(gameOverText).toContain('¡El tiempo se ha acabado!');
        });
    });

    afterAll(async () => {
        await browser.close();
    });
});