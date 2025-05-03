const { TestEnvironment } = require('jest-environment-node');
const puppeteer = require('puppeteer');

class PuppeteerEnvironment extends TestEnvironment {
    constructor(config) {
        super(config);
    }

    async setup() {
        await super.setup();
        const browserOptions = {
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ],
            headless: "new"
        };

        this.global.browser = await puppeteer.launch(browserOptions);

        this.global.newPage = async () => {
            const page = await this.global.browser.newPage();
            return page;
        };
    }

    async teardown() {
        if (this.global.browser) {
            await this.global.browser.close();
        }
        await super.teardown();
    }
}

module.exports = PuppeteerEnvironment;