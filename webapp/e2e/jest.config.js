module.exports = {
    testMatch: [
        "**/steps/**/*.steps.js",
        "**/__tests__/**/*.[jt]s?(x)",
        "**/?(*.)+(spec|test).[tj]s?(x)"
    ],
    testTimeout: 30000,
    setupFilesAfterEnv: ["expect-puppeteer"],
};
