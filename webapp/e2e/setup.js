jest.setTimeout(450000);
beforeAll(async () => {
    global.BROWSER_CONFIG = {
        launch: {
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ],
            headless: "new"
        }
    };
});