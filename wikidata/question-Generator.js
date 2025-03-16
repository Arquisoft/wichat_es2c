// question-Generator.js
const { fetchCapitalQuestion } = require('./wikidata-client');

async function generateQuestion() {
    const data = await fetchCapitalQuestion();

    if (data.length < 4) {
        throw new Error('Not enough data to generate question');
    }

    const ind = Math.floor(Math.random() * data.length);
    const goodChoice = data[ind];

    const badChoices = data.filter((_, index) => index !== ind)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

    const choices = [
        ...badChoices.map(choice => choice.capitalLabel.value),
        goodChoice.capitalLabel.value
    ].sort(() => 0.5 - Math.random());

    const flagUrl = goodChoice.flag ? goodChoice.flag.value : null;

    return {
        question: `¿Cuál es la capital de ${goodChoice.countryLabel.value}?`,
        choices: choices,
        answer: goodChoice.capitalLabel.value,
        image: flagUrl
    };
}

// Asegúrate de exportar correctamente la función
module.exports = {
    generateQuestion
};