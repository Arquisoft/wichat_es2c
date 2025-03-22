const axios = require('axios');

async function fetchCapitalQuestion() {
    const query = `
    SELECT ?countryLabel ?capitalLabel ?flag
    WHERE {
        ?country wdt:P31 wd:Q6256;  # Filtra solo países
                 wdt:P36 ?capital.   # Obtiene la capital
        OPTIONAL { ?country wdt:P41 ?flag }
        
        SERVICE wikibase:label { bd:serviceParam wikibase:language "es".}
        }
        LIMIT 50
        `;
    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;

    try {
        const response = await axios.get(url);
        console.log('Data from Wikidata:', response.data.results.bindings); // Log de datos
        return response.data.results.bindings;
    } catch (error) {
        console.error("Error fetching data from Wikidata:", error); // Log de error
        throw new Error('Error fetching data from Wikidata: ' + error.message);
    }
}

module.exports = {
    fetchCapitalQuestion
};