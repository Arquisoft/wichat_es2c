const axios = require('axios');
const express = require('express');

//para acceeder a los env
require("dotenv").config();

const app = express();
const port = 8003;

// Middleware to parse JSON in request body
app.use(express.json());

// Define configurations for different LLM APIs
const llmConfigs = {
  gemini: {
    url: (apiKey) => `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    
    /*transformRequest: (question) => ({
      contents: [{ parts: [{ text: question }] }]
    }),*/  //Le paso tabien el contexto sobre el que tiene que trabajar la IA previamente a la propia pregunta del usuario (role system)
    transformRequest: (contextPromt, question) => ({  //ESTE contextPromt LO ESTABLEZCO EN SU PROPIO METODO
      contents: [{ parts: [{ text: contextPromt + "\n Pregunta Usuario:" + question }] }]
    }),

    transformResponse: (response) => response.data.candidates[0]?.content?.parts[0]?.text
  },
  empathy: {
    //url: () => 'https://empathyai.staging.empathy.co/v1/chat/completions',
    url: () => 'https://empathyai.prod.empathy.co/v1/chat/completions',
    //transformRequest: (question) => ({
    transformRequest: (contextPromt, question) => ({
      model: "qwen/Qwen2.5-Coder-7B-Instruct",
      messages: [
        { role: "system", content: contextPromt }, //asi sabe como debe comportarse
        { role: "user", content: question }
      ]
    }),
    transformResponse: (response) => response.data.choices[0]?.message?.content,
    headers: (apiKey) => ({
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    })
  }
};

// Function to validate required fields in the request body
function validateRequiredFields(req) {
  const requiredFields = ['userQuestion', 'gameQuestion', 'answers', 'correctAnswer'];

  for (const field of requiredFields) {
    if (!(field in req.body)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

}

// Generic function to send questions to LLM
async function sendQuestionToLLM(contextPromt, question, apiKey, model = 'gemini') {
  try {
    const config = llmConfigs[model];
    if (!config) {
      throw new Error(`Model "${model}" is not supported.`);
    }

    const url = config.url(apiKey);
    const requestData = config.transformRequest(contextPromt, question);

    const headers = {
      'Content-Type': 'application/json',
      ...(config.headers ? config.headers(apiKey) : {})
    };

    const response = await axios.post(url, requestData, { headers });

    console.log(`Response: `, response.status);

    console.log('PRUEBA');
    console.log("Enviando solicitud al LLM con estos datos:");
    console.log("- Modelo:", model);
    console.log("- Contexto (primeros 100 caracteres):", contextPromt);
    console.log("- Pregunta usuario:", question);

    return config.transformResponse(response);

  } catch (error) {
    console.error(`Error sending question to ${model}:`, error.message || error);

    //Comprobacion para ver si hubo respuesta, y si informacion
    if (error.response) {
      console.error(`Response data: ${JSON.stringify(error.response.data)}`);
      console.error(`Response status: ${error.response.status}`);
    }

    return null;
  }
}

//Antes del post ask, configuro el como quiro que realice las pistas a dar al usuario
const contextAndFormatPromptAI = `Eres un asistente virtual cuya funcion es ayudar a jugadores de un juego de preguntas de estilo Quiz dándoles pistas sobre la respuesta correcta a la pregunta del juego.\
  Así, debes asegurarte de dar una pista que le ayude a responder correctamente a la pregunta, siguiendo las siguientes normas:\

  ##Formato de pistas dadas:\
  -No puedes dar la respuesta de la pregunta directamente al usuario.\
  -No puedes responder al usuario ni con un una afirmación ni con una negación.\
  -No puedes responder al usuario con otra pregunta.\
  -No puedes contestar referenciando alguna de las opciones de respuesta.\


  ##Ejemplos de interraciones Incorrectas:\
  -Usuario: "¿Es París?"\
  -IA: "No, la respuesta correcta es Roma."\
  -Usuario: "¿Cuál es la respuesta?"\
  -IA: "La respuesta correcta es Mickey Mouse."\
  

  ##Ejemplos de interraciones Correctas:\
  -Usuario: "¿Cuál es este personaje?"\
  -IA: "Salió en una serie muy famosa de los 90s."\


  ##Tu misión es dar las mejores pistas posibles de forma sútil y que no desvelen la respuesta correcta a la pregunta del juego.\
  ##Datos sobre el que basar la pista a generar:\
  {questionAndAnswersData}
  `
  ;

  configureContextPromt = (gameQuestion, answers, correctAnswer) => {
    //string con la pregunta y todas las opciones (para que la ia pueda manejarlas)
    const questionAndAnswersData = `
      Pregunta del juego: ${gameQuestion}
      Opciones de respuesta:
      ${answers.map((answer, index) => `- ${answer}${answer === correctAnswer ? ' (Esta es la respuesta correcta)' : ''}`).join('\n    ')}
    `;
    
    return contextAndFormatPromptAI.replace('{questionAndAnswersData}', questionAndAnswersData);
  }



app.post('/ask', async (req, res) => {
  try {
    // Check if required fields are present in the request body
    validateRequiredFields(req);

    //const { question, model, apiKey } = req.body;
    const { model = 'empathy', userQuestion, gameQuestion, answers, correctAnswer } = req.body;

    let apiKey = process.env.LLM_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'LLM_API_KEY IS NOT FOUND.' });
    }

    // Configura el contexto con toda la información disponible
    const contextPromt = configureContextPromt(gameQuestion, answers, correctAnswer);

    //const answer = await sendQuestionToLLM(question, apiKey, model);
    const answer = await sendQuestionToLLM(contextPromt, userQuestion, apiKey, model);

    res.json({ answer });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const server = app.listen(port, () => {
  console.log(`LLM Service listening at http://localhost:${port}`);
});

module.exports = server


