const { fetchCapitalQuestion } = require(' •/wikidata-client*');
async function generateQuestion() {
    const data = await fetchCapitalQuestion();

    if (data.length < 4) {
        throw new Error ('Not enough dasta to generate question');
    }

    const ind=Math.floor (Math. random() * data.length);
    const goodChoice = data[ind];

    const badChoices = data.filter((_, index) => index !== ind).
    sort(() => 0.5 - Math. random()).slice(0, 3);


    const choices = [...badChoices.map(choice => choice.capitalLabel.value), goodChoice.capitallabel.value].
    sort(() => 0.5 - Math. random());

// Obtain URL flog imoge (if available)
    const flagUrl = goodChoice.flag ? goodChoice.flag.value : null;

    return {
        question: '¿Cuál es la capital de ${goodChoice.countryLabel.value}?',
        choices: choices,
        answer: goodChoice.capitallabel.value,
        image: flagUrl
    };

}
