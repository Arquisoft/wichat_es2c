const axios = require('axios');

async function fetchQuestion(type = 'pokemon') {
    let query;

    switch (type) {
        case 'capital':
            query = `
                SELECT ?countryLabel ?capitalLabel ?flag ?image
                WHERE {
                    ?country wdt:P31 wd:Q6256;  # Filtra solo países
                             wdt:P36 ?capital.   # Obtiene la capital
                    ?country wdt:P41 ?flag }  # Bandera
                    SERVICE wikibase:label { bd:serviceParam wikibase:language "es". }
                }
                LIMIT 50
            `;
            break;

        case 'sports':
            query = `
            SELECT DISTINCT ?teamLabel ?crest ?crestURL ?countryLabel
                WHERE {
                # Filtra por equipos de fútbol
                ?team wdt:P31/wdt:P279* wd:Q476028;  # Equipo de fútbol
                 wdt:P17 ?country;              # País del equipo
                wdt:P41 ?crest.                # Imagen relacionada con el equipo (no solo escudos)

                # Filtra por equipos en Europa
                ?country wdt:P30 wd:Q46.             # País debe estar en Europa
                 # Etiquetas en español
                 SERVICE wikibase:label { bd:serviceParam wikibase:language "es". }
               }
                LIMIT 50
            `;
            break;

        case 'cartoon':
            query = `
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
             FILTER (!REGEX(STR(?itemLabel), "^Q[0-9]+$"))
                }
            LIMIT 50
    `;
            break;

        case 'animal':
            query= `
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
LIMIT 10
        `;
            break;
        default:
            throw new Error('Tipo de pregunta no válido');
    }

    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;

    try {
        const response = await axios.get(url);
        console.log(`Data from Wikidata (${type}):`, response.data.results.bindings); // Log de datos
        return response.data.results.bindings;
    } catch (error) {
        console.error(`Error fetching data from Wikidata (${type}):`, error); // Log de error
        throw new Error(`Error fetching data from Wikidata (${type}): ${error.message}`);
    }
}

module.exports = {
    fetchQuestion
};