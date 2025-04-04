const puppeteer = require('puppeteer');
const { defineFeature, loadFeature } = require('jest-cucumber');
const setDefaultOptions = require('expect-puppeteer').setDefaultOptions;
const feature = loadFeature('./features/register-login-form.feature');

let page;
let browser;
let testUser = {
  username: `pablo${Date.now()}`, //para que siempre sea un nuevo usuario
  password: 'password123'
};

defineFeature(feature, test => {

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: false, slowMo: 100 });
    page = await browser.newPage();
    setDefaultOptions({ timeout: 10000 });
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await page.evaluate(() => localStorage.clear());
  });

  test('The user is not registered in the site', ({ given, when, then }) => {
    given('An unregistered user', async () => {
      await page.click('a[href="/signup"]');
    });

    when('I fill the data in the register form and press submit', async () => {
      await expect(page).toFill('input[name="username"]', testUser.username);
      await expect(page).toFill('input[name="password"]', testUser.password);
      await expect(page).toClick('button', { text: 'Register' });
    });

    then('A confirmation message should be shown in the screen', async () => {
      await page.waitForXPath('//*[contains(text(), "Successfully registered!")]')
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
    });
  });

  test('The same user logs in after registration', ({ given, when, then }) => {
    given('The user is on the login page', async () => {
      expect(page.url()).toContain('/login');
    });

    when('They fill the login form with the same credentials', async () => {
      await expect(page).toFill('input[name="username"]', testUser.username);
      await expect(page).toFill('input[name="password"]', testUser.password);
      await expect(page).toClick('button', { text: 'Login' });
    });

    then('They should be redirected to the home page', async () => {
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      expect(page.url()).toContain('/home');
    });
  });

  afterAll(async () => {
    await browser.close();
  });


});