const { fetchQuestion } = require('./wikidata-client'); // Importa la función fetchQuestion

async function generateQuestion(type = 'animal') {
    console.log("Tipo de pregunta recibido:", type);
    // Obtener datos según el tipo de pregunta
    const data = await fetchQuestion(type);

    if (data.length < 4) {
        throw new Error('Not enough data to generate question');
    }

    // Seleccionar una respuesta correcta al azar
    const ind = Math.floor(Math.random() * data.length);
    const goodChoice = data[ind];

    // Seleccionar 3 respuestas incorrectas
    const badChoices = data.filter((_, index) => index !== ind)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

    // Generar las opciones de respuesta
    let choices, question, answer, image = null;

    switch (type) {
        case 'capital':
            choices = [
                ...badChoices.map(choice => choice.capitalLabel.value),
                goodChoice.capitalLabel.value
            ].sort(() => 0.5 - Math.random());

            question = `¿Cuál es la capital de ${goodChoice.countryLabel.value}?`;
            answer = goodChoice.capitalLabel.value;
            image = goodChoice.flag ? goodChoice.flag.value : null; // Imagen del país
            break;

        case 'sports':
            choices = [
                ...badChoices.map(choice => choice.teamLabel.value),
                goodChoice.teamLabel.value
            ].sort(() => 0.5 - Math.random());

            question = "¿A qué equipo pertenece esta imagen?";
            answer = goodChoice.teamLabel.value;
            image = goodChoice.crest ? goodChoice.crest.value : null; // Escudo del equipo
            break;

        case 'cartoon':
            // Suponiendo que tienes el array `badChoices` con otras opciones incorrectas y `goodChoice` con la opción correcta
            choices = [
                ...badChoices.map(choice => choice.itemLabel.value),
                goodChoice.itemLabel.value
            ].sort(() => 0.5 - Math.random());

            question = "¿Quién es este personaje de dibujos animados?";  // Pregunta sobre el personaje
            answer = goodChoice.itemLabel.value;  // Respuesta correcta (nombre del personaje)
            image = goodChoice.image ? goodChoice.image.value : null;  // Imagen del personaje de dibujos animados
            break;

        case 'animal':
            // Suponiendo que tienes el array `badChoices` con otras opciones incorrectas y `goodChoice` con la opción correcta
            choices = [
                ...badChoices.map(choice => choice.animalLabel.value),  // Nombres de animales incorrectos
                goodChoice.animalLabel.value  // Nombre del animal correcto
            ].sort(() => 0.5 - Math.random());  // Mezcla las opciones aleatoriamente

            question = "¿Qué pájaro es este animal?";  // Pregunta sobre el animal
            answer = goodChoice.animalLabel.value;  // Respuesta correcta (nombre del animal)
            image = goodChoice.image ? goodChoice.image.value : null;  // Imagen del animal

            break;

        default:
            throw new Error('Tipo de pregunta no válido');
    }

    return {
        question: question,
        choices: choices,
        answer: answer,
        image: image // Imagen para todos los tipos de pregunta
    };
}

// Exportar la función
module.exports = {
    generateQuestion
};