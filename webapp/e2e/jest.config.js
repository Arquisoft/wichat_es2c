module.exports = {
    testMatch: [
        "**/steps/**/*.steps.js",
        "**/__tests__/**/*.[jt]s?(x)",
        "**/?(*.)+(spec|test).[tj]s?(x)"
    ],
    testTimeout: 450000,
    setupFilesAfterEnv: ["expect-puppeteer", "./setup.js"],
    testEnvironment: "./puppeteer-environment.js"
};