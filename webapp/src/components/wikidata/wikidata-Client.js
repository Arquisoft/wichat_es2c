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
        const url =`https://query.wikidata.org/spargl?query_S(encodeURIComponent(query)/&formatojson*`;
        try {
            const response = await axios.get(url);
            return response.data.results.bindings;
        } catch (error) {
            console.error ("Error fetching data fron Wikidata:", error);
        }
}
module.exports= {
    fetchCapitalQuestion
};