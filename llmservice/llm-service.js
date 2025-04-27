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
      contents: [{ parts: [{ text: contextPromt + "\n User question:" + question }] }]
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
const contextAndFormatPromptAI = `You are a virtual assistant whose function is to help players in a Quiz-style question game by providing hints about the correct answer to the game’s question.
Thus, you must ensure that you give a hint following these rules:\

  FORMAT AND RULES TO FOLLOW:
      - Offer hints related to general knowledge, history, culture, or logical reasoning that might help the player recall the correct answer.
      - The hint must be INDIRECT but USEFUL — it should guide the user toward the correct answer by helping them think or recall relevant information.
      - Limit hints to 1–2 sentences. Be concise and to the point.
      - Stay neutral and avoid leading language.

  RESTRICTIONS:
      - DO NOT reveal or confirm the correct answer.
      - DO NOT refer to any of the multiple-choice options.
      - DO NOT give name-based hints.
      - DO NOT eliminate or validate any of the multiple-choice options.
      - DO NOT respond to the user with either confirmation or denial.
      - DO NOT respond with anything not related to the question or hint.

  ##Reply in English.\

  ##Information on which to base the hint to be generated:\
  {questionAndAnswersData}
  `
  ;

  configureContextPromt = (gameQuestion, answers, correctAnswer) => {
    //string con la pregunta y todas las opciones (para que la ia pueda manejarlas)
    const questionAndAnswersData = `
      Game question: ${gameQuestion}
      Answer choices:
      ${answers.map((answer, index) => `- ${answer}${answer === correctAnswer ? ' (This is the correct answer)' : ''}`).join('\n    ')}
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


