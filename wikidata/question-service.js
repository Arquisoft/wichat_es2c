const express = require("express");
const cors = require("cors");
const {json} = require("express");
const { Question, Answer } = require('./wikidata-model');
const app = express();
app.use(cors());
const mongoose = require('mongoose');
const axios = require("axios");
app.use(express.json());
let added = false;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';
mongoose.connect(mongoUri);
const PORT = 3005;
const questionCache = {
    capitals: { data: null, lastUpdate: null },
    sports: { data: null, lastUpdate: null },
    cartoons: { data: null, lastUpdate: null },
    birds: { data: null, lastUpdate: null },
};

const recentlyUsedQuestions = {
    capitals: new Set(),
    sports: new Set(),
    cartoons: new Set(),
    birds: new Set()
};
async function addQuestionsCapital() {
    const CACHE_DURATION = 1000 * 60 * 60;
    const cache = questionCache.capitals;
    if (!cache.data || (Date.now() - cache.lastUpdate > CACHE_DURATION)) {
        try {
            let query = `
                SELECT ?countryLabel ?capitalLabel (SAMPLE(?flagURL) as ?flag)
            WHERE {
                 ?country wdt:P31 wd:Q6256;  # Countries
                 wdt:P36 ?capital;   # Capitals
                 wdt:P41 ?flagURL.   # Flags
        
                SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
              }       
                GROUP BY ?countryLabel ?capitalLabel
                LIMIT 150
                `;
            const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
            const response = await axios.get(url);
            const countries = response.data.results.bindings;

            cache.data = countries.map(country => {
                const incorrectCountries = countries
                    .filter(c => c.countryLabel.value !== country.countryLabel.value)
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 3);

                const answers = [
                    new Answer({
                        text: country.capitalLabel.value,
                        correct: true,
                        selected: false
                    }),
                    ...incorrectCountries.map(incorrectCountry =>
                        new Answer({
                            text: incorrectCountry.capitalLabel.value,
                            correct: false,
                            selected: false
                        })
                    )
                ];

                const shuffledAnswers = answers.sort(() => 0.5 - Math.random());

                const flagUrl = country.flag ? country.flag.value : null;
                return new Question({
                    text: `Whats the capital city of ${country.countryLabel.value}?`,
                    answers: shuffledAnswers,
                    image: flagUrl,
                    category: 'capitals',
                });
            });
            cache.lastUpdate = Date.now();

            await Question.deleteMany({category: 'capitals'});
            await Question.insertMany(cache.data);
        } catch (error) {
            console.error("Error fetching or saving capital questions:", error);
        }
    }
    return cache.data;
}

async function addQuestionsSports() {
    const CACHE_DURATION = 1000 * 60 * 60;
    const cache = questionCache.sports;

    // Si no hay caché o ha pasado más de una hora desde la última actualización, se generan preguntas
    if (!cache.data || (Date.now() - cache.lastUpdate > CACHE_DURATION)) {
        try {
            let query = `
                SELECT DISTINCT ?teamLabel ?crest ?countryLabel
                WHERE {
                    ?team wdt:P31/wdt:P279* wd:Q476028;  # Equipo de fútbol
                    wdt:P17 ?country;              # País del equipo
                    wdt:P41 ?crest.                # Imagen relacionada con el equipo

                    # Filtra por equipos en Europa
                    ?country wdt:P30 wd:Q46.             # País debe estar en Europa
                    SERVICE wikibase:label { bd:serviceParam wikibase:language "es". }
                }
                LIMIT 150
            `;

            // Realizamos la solicitud SPARQL
            const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
            const response = await axios.get(url);

            const results = response.data.results.bindings;

            cache.data = results.map(result => {
                // Filtrar equipos incorrectos para generar opciones
                const incorrectTeams = results
                    .filter(t => t.teamLabel.value !== result.teamLabel.value)
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 3);

                // Crear respuestas (correcta + incorrectas)
                const answers = [
                    new Answer({
                        text: result.teamLabel.value,
                        correct: true,
                        selected: false
                    }),
                    ...incorrectTeams.map(incorrectTeam =>
                        new Answer({
                            text: incorrectTeam.teamLabel.value,
                            correct: false,
                            selected: false
                        })
                    )
                ];

                // Mezclar las respuestas
                const shuffledAnswers = answers.sort(() => 0.5 - Math.random());

                // URL de la imagen del escudo del equipo
                const crestUrl = result.crest ? result.crest.value : null;

                // Crear la pregunta sobre el equipo de fútbol
                return new Question({
                    text: `¿A qué equipo pertenece esta bandera?`,
                    answers: shuffledAnswers,
                    image: crestUrl,
                    category: 'sports',
                });
            });

            // Actualizamos la hora del último caché
            cache.lastUpdate = Date.now();

            // Eliminar solo las preguntas de la categoría "sports" y agregar las nuevas preguntas
            await Question.deleteMany({ category: 'sports' });
            await Question.insertMany(cache.data);

        } catch (error) {
            console.error("Error fetching or saving team questions:", error);
        }
    }

    return cache.data;
}

async function addQuestionsCartoons() {
    const CACHE_DURATION = 1000 * 60 * 60;
    const cache = questionCache.cartoons;

    if (!cache.data || (Date.now() - cache.lastUpdate > CACHE_DURATION)) {
        try {
            let query = `
                SELECT ?itemLabel ?image
                WHERE {
                    # Filtra solo personajes de dibujos animados
                    ?item wdt:P31/wdt:P279* wd:Q95074.  # Personaje de dibujos animados (Q95074)

                    # Obtiene la imagen asociada directamente al personaje
                    ?item wdt:P18 ?image.

                    # Etiquetas en español
                    SERVICE wikibase:label { 
                        bd:serviceParam wikibase:language "es". 
                        ?item rdfs:label ?itemLabel.
                    }
                    
                    # Filtra identificadores numéricos (como "Q1234")
                    FILTER (!REGEX(STR(?itemLabel), "^Q[0-9]+$"))
                }
                LIMIT 150
            `;

            // Usamos la query para hacer la solicitud SPARQL
            const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
            const response = await axios.get(url);

            // Asegurarnos de que la respuesta tenga los datos necesarios
            const results = response.data.results.bindings;

            // Mapeamos los resultados de la consulta
            cache.data = results.map(result => {
                // Filtrar personajes incorrectos para generar opciones
                const incorrectCharacters = results
                    .filter(c => c.itemLabel.value !== result.itemLabel.value)
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 3);

                // Crear respuestas (correcta + incorrectas)
                const answers = [
                    new Answer({
                        text: result.itemLabel.value,
                        correct: true,
                        selected: false
                    }),
                    ...incorrectCharacters.map(incorrectCharacter =>
                        new Answer({
                            text: incorrectCharacter.itemLabel.value,
                            correct: false,
                            selected: false
                        })
                    )
                ];

                // Mezclar las respuestas
                const shuffledAnswers = answers.sort(() => 0.5 - Math.random());

                // URL de la imagen del personaje
                const imageUrl = result.image ? result.image.value : null;

                // Crear la pregunta sobre el personaje animado
                return new Question({
                    text: `¿Cómo se llama este personaje de dibujos animados?`,
                    answers: shuffledAnswers,
                    image: imageUrl,  // Imagen del personaje
                    category: 'cartoons',
                });
            });

            // Actualizamos la hora del último caché
            cache.lastUpdate = Date.now();

            // Eliminar las preguntas anteriores de la base de datos y agregar las nuevas
            await Question.deleteMany({category: 'cartoons'});
            await Question.insertMany(cache.data);
        } catch (error) {
            console.error("Error fetching or saving cartoon character questions:", error);
        }
    }

    return cache.data;
}

async function addQuestionsBirds() {
    const CACHE_DURATION = 1000 * 60 * 60;

    const cache = questionCache.birds;

    if (!cache.data || (Date.now() - cache.lastUpdate > CACHE_DURATION)) {
        try {
            let query = `
                SELECT DISTINCT ?animalLabel ?image
                WHERE {
                    ?animal wdt:P31 wd:Q16521.  # Especies (Q16521 es "especie" en Wikidata)
                    ?animal wdt:P105 wd:Q7432.  # Taxón (Q7432 es "taxón" en Wikidata)
                    ?animal wdt:P171* wd:Q5113. # Aves (Q5113 es "ave" en Wikidata)
                    ?animal wdt:P1843 ?animalLabel.

                    # Obtiene la imagen asociada directamente al animal
                    ?animal wdt:P18 ?image.

                    SERVICE wikibase:label { 
                        bd:serviceParam wikibase:language "es". 
                    }

                    # Filtra para asegurarse de que la etiqueta esté en español
                    FILTER(LANG(?animalLabel) = "es")
                }
                LIMIT 150
            `;

            // Usamos la query para hacer la solicitud SPARQL
            const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
            const response = await axios.get(url);

            // Asegurarnos de que la respuesta tenga los datos necesarios
            const results = response.data.results.bindings;

            // Mapeamos los resultados de la consulta
            cache.data = results.map(result => {
                // Filtrar aves incorrectas para generar opciones
                const incorrectBirds = results
                    .filter(b => b.animalLabel.value !== result.animalLabel.value)
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 3);

                // Crear respuestas (correcta + incorrectas)
                const answers = [
                    new Answer({
                        text: result.animalLabel.value,
                        correct: true,
                        selected: false
                    }),
                    ...incorrectBirds.map(incorrectBird =>
                        new Answer({
                            text: incorrectBird.animalLabel.value,
                            correct: false,
                            selected: false
                        })
                    )
                ];

                // Mezclar las respuestas
                const shuffledAnswers = answers.sort(() => 0.5 - Math.random());

                // URL de la imagen del ave
                const imageUrl = result.image ? result.image.value : null;

                // Crear la pregunta sobre el ave
                return new Question({
                    text: `¿Qué especie de ave es esta?`,
                    answers: shuffledAnswers,
                    image: imageUrl,  // Imagen del ave
                    category: 'birds',
                });
            });

            // Actualizamos la hora del último caché
            cache.lastUpdate = Date.now();

            // Eliminar las preguntas anteriores de la base de datos y agregar las nuevas
            await Question.deleteMany({category: 'birds'});
            await Question.insertMany(cache.data);
        } catch (error) {
            console.error("Error fetching or saving bird questions:", error);
        }
    }

    return cache.data;
}

app.get('/getQuestion', async (req, res) => {
    try {
        const category = req.query.category;

        let questions = await Question.find({ category: category });
        if(questions.length<150) {
            if (category === 'birds') {
                await addQuestionsBirds();
            } else if (category === 'sports') {
                await addQuestionsSports();
            } else if (category === 'cartoons') {
                await addQuestionsCartoons();
            } else {
                await addQuestionsCapital();
            }

            // Esperamos a que las preguntas se inserten y las volvemos a obtener
            questions = await Question.find({category: category});

            if (questions.length === 0) {
                return res.status(404).json({error: `No questions found for category: ${category}`});
            }
        }

        // Filtramos las preguntas ya usadas
        const availableQuestions = questions.filter(q =>
            !recentlyUsedQuestions[category].has(q._id.toString())
        );

        if (availableQuestions.length < questions.length * 0.2) {
            recentlyUsedQuestions[category].clear();
        }

        // Seleccionamos una pregunta aleatoria
        const selectedQuestion = availableQuestions.length > 0
            ? availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
            : questions[Math.floor(Math.random() * questions.length)];

        recentlyUsedQuestions[category].add(selectedQuestion._id.toString());

        const choices = selectedQuestion.answers
            .map(answer => answer.text)
            .sort(() => 0.5 - Math.random());

        const correctAnswer = selectedQuestion.answers
            .find(answer => answer.correct)?.text;

        const image = selectedQuestion.image || null;

        // Respondemos con la pregunta seleccionada
        res.json({
            question: selectedQuestion.text,
            choices: choices,
            answer: correctAnswer,
            image: image
        });
    } catch (error) {
        console.error("Error generating question:", error);
        res.status(500).json({ error: 'Failed to generate question', details: error.message });
    }
});

const server = app.listen(PORT, () => {
    console.log(`Wikidata Service listening at http://localhost:${PORT}`);
});

server.on('close', () => {
    mongoose.connection.close();
});
