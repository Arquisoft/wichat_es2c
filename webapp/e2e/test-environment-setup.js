const { MongoMemoryServer } = require('mongodb-memory-server');
const puppeteer = require('puppeteer');

let mongoserver;
let userservice;
let authservice;
let llmservice;
let gatewayservice;
let game;
let wikidata;
let api;

global.puppeteerConfig = {
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

async function startServer() {
    console.log('Starting MongoDB memory server...');
    mongoserver = await MongoMemoryServer.create();
    const mongoUri = mongoserver.getUri();
    process.env.MONGODB_URI = mongoUri;
    userservice = await require("../../users/userservice/user-service");
    authservice = await require("../../users/authservice/auth-service");
    llmservice = await require("../../llmservice/llm-service");
    gatewayservice = await require("../../gatewayservice/gateway-service");
    game = await require("../../game/game-service");
    wikidata = await require("../../wikidata/question-service");
    api = await require("../../users/userinfoapi/userinfo-service");
}

startServer();