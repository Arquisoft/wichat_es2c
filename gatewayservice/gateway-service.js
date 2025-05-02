const express = require('express');
const axios = require('axios');
const cors = require('cors');
const promBundle = require('express-prom-bundle');
const client = require('prom-client');
//libraries required for OpenAPI-Swagger
const swaggerUi = require('swagger-ui-express'); 
const fs = require("fs")
const YAML = require('yaml')

const app = express();
const port = 8000;

const llmServiceUrl = process.env.LLM_SERVICE_URL || 'http://localhost:8003';
const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:8002';
const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:8001';
const gameServiceUrl = process.env.GAME_SERVICE_URL || 'http://localhost:8004';
const wikidataServiceUrl = process.env.WIKIDATA_SERVICE_URL || 'http://localhost:3005';

app.use(cors());
app.use(express.json());

//Prometheus configuration
const metricsMiddleware = promBundle({includeMethod: true});
app.use(metricsMiddleware);

// Counter for addMatch endpoint
const addMatchCounter = new client.Counter({
  name: 'gateway_add_match_requests_total',
  help: 'Total number of requests to the /addMatch endpoint',
});

// Counter for adduser endpoint
const addUserCounter = new client.Counter({
  name: 'gateway_add_user_requests_total',
  help: 'Total number of requests to the /adduser endpoint',
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.post('/login', async (req, res) => {
  try {
    // Forward the login request to the authentication service
    const authResponse = await axios.post(authServiceUrl+'/login', req.body);
    res.json(authResponse.data);
  } catch (error) {
    res.status(error.response.status).json({ error: error.response.data.error });
  }
});

app.post('/adduser', async (req, res) => {
  try {
    addUserCounter.inc();
    const userResponse = await axios.post(userServiceUrl+'/adduser', req.body);
    res.json(userResponse.data);
  } catch (error) {
    res.status(error.response.status).json({ error: error.response.data.error });
  }
});

app.post('/addQuestion', async (req, res) => {
  try {
    const userResponse = await axios.post(gameServiceUrl+'/addQuestion', req.body);
    res.json(userResponse.data);
  } catch (error) {
    res.status(error.response.status).json({ error: error.response.data.error });
  }
});


app.post('/addMatch', async (req, res) => {
  try {
    addMatchCounter.inc();
    const userResponse = await axios.post(gameServiceUrl+'/addMatch', req.body);
    res.json(userResponse.data);
  } catch (error) {
    res.status(error.response.status).json({ error: error.response.data.error });
  }
});

app.post('/endMatch', async (req, res) => {
  try {
    const userResponse = await axios.post(gameServiceUrl+'/endMatch', req.body);
    res.json(userResponse.data);
  } catch (error) {
    res.status(error.response.status).json({ error: error.response.data.error });
  }
});


app.post('/addQuestions', async (req, res) => {
  try {
    const userResponse = await axios.post(wikidataServiceUrl+'/addQuestions', req.body);
    res.json(userResponse.data);
  } catch (error) {
    res.status(error.response.status).json({ error: error.response.data.error });
  }
});

app.get('/getQuestion', async (req, res) => {
  try {
    const userResponse = await axios.get(wikidataServiceUrl+'/getQuestion', {
      params: req.query
    });
    res.json(userResponse.data);
  } catch (error) {
    res.status(error.response.status).json({ error: error.response.data.error });
  }
});


app.post('/askllm', async (req, res) => {
  try {
    // Verificamos que estén presentes todos los campos necesarios
    const requiredFields = ['model', 'userQuestion', 'gameQuestion', 'answers', 'correctAnswer'];
    for (const field of requiredFields) {
      if (!(field in req.body)) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // Forward the request to the llm service
    const llmResponse = await axios.post(llmServiceUrl+'/ask', {
      model: req.body.model,
      userQuestion: req.body.userQuestion,
      gameQuestion: req.body.gameQuestion,
      answers: req.body.answers,
      correctAnswer: req.body.correctAnswer
    });

    res.json(llmResponse.data);
  } catch (error) {
    console.error("Error en /askllm:", error.message);

    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data.error });
    } else {
      res.status(500).json({ error: 'Internal error' });
    }
  }
});


//get las partidas para el historial (usa luego el game-service)
app.get('/userMatches', async (req, res) => {
  try {
    const userResponse = await axios.get(`${gameServiceUrl}/userMatches`, {
      params: req.query //esto para pasar los params de la query
    });
    res.json(userResponse.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || 'Error desconocido' });
  }
});

//get las estadisticas del usuario (usa luego el game-service)
app.get('/userStatistics', async (req, res) => {
  try {
    const userResponse = await axios.get(`${gameServiceUrl}/userStatistics`, {
      params: req.query
    });
    res.json(userResponse.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.error || 'Internal error trying to obtain the user list' });
  }
});


//Obtiene los usuarios de la API de usuarios (userinfo-service)
app.get('/users', async (req, res) => {
  try {
    const userInfoServiceUrl = process.env.USERINFO_SERVICE_URL || 'http://localhost:8005';
    const userResponse = await axios.get(`${userInfoServiceUrl}/userinfo`);
    

    const usernames = userResponse.data.map(user => ({
      username: user.username
    }));
    
    res.json(usernames);
  } catch (error) {
    console.error("Error fetching users:", error);
    
    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data.error });
    } else {
      res.status(500).json({ error: 'Error when trying to access the user list' });
    }
  }
});
// get los matches de un usuario específico desde userinfo-service
app.get('/userinfo/matches/:username', async (req, res) => {
  try {
    const userInfoServiceUrl = process.env.USERINFO_SERVICE_URL || 'http://localhost:8005';
    const username = req.params.username;
    
    const matchesResponse = await axios.get(`${userInfoServiceUrl}/userinfo/matches/${username}`);
    
    res.json(matchesResponse.data);
  } catch (error) {
    console.error(`Error fetching matches for user ${req.params.username}:`, error);
    
    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data.error });
    } else {
      res.status(500).json({ error: 'Error when trying to access users matches' });
    }
  }
});
//obtener el ranking por score desde el userinfo-service
app.get('/scoreRanking', async (req, res) => {
  try {
    const userInfoServiceUrl = process.env.USERINFO_SERVICE_URL || 'http://localhost:8005';
    const rankingResponse = await axios.get(`${userInfoServiceUrl}/userinfo/ranking/bestScore`);
    
    res.json(rankingResponse.data);
  } catch (error) {
    console.error("Error fetching score ranking:", error);
    
    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data.error });
    } else {
      res.status(500).json({ error: 'Error fetching score ranking' });
    }
  }
});
//obtener el ranking por cantidad de partidas desde el userinfo-service
app.get('/nMatchesRanking', async (req, res) => {
  try {
    const userInfoServiceUrl = process.env.USERINFO_SERVICE_URL || 'http://localhost:8005';
    const rankingResponse = await axios.get(`${userInfoServiceUrl}/userinfo/ranking/morePlayed`);
    
    res.json(rankingResponse.data);
  } catch (error) {
    console.error("Error fetching number of matches ranking:", error);
    
    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data.error });
    } else {
      res.status(500).json({ error: 'Error fetching number of matches ranking' });
    }
  }
});

// Read the OpenAPI YAML file synchronously
openapiPath='./openapi.yaml'
if (fs.existsSync(openapiPath)) {
  const file = fs.readFileSync(openapiPath, 'utf8');

  // Parse the YAML content into a JavaScript object representing the Swagger document
  const swaggerDocument = YAML.parse(file);

  // Serve the Swagger UI documentation at the '/api-doc' endpoint
  // This middleware serves the Swagger UI files and sets up the Swagger UI page
  // It takes the parsed Swagger document as input
  app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} else {
  console.log("Not configuring OpenAPI. Configuration file not present.")
}


// Start the gateway service
const server = app.listen(port, () => {
  console.log(`Gateway Service listening at http://localhost:${port}`);
});

module.exports = server
