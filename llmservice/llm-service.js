const axios = require('axios');
const express = require('express');

//to access env variables
require("dotenv").config();

const app = express();
const port = 8003;

// Middleware to parse JSON in request body
app.use(express.json());


const LLM_MODELS = {
  PRIMARY: 'empathyMistral',
  SECONDARY: 'empathyQwen',
  ACTUAL: 'empathyMistral'
};
// Define el orden de los modelos para el failover
const MODEL_FAILOVER_ORDER = [
  LLM_MODELS.PRIMARY,
  LLM_MODELS.SECONDARY
];

// Define configurations for different LLM APIs
const llmConfigs = {
  gemini: {
    url: (apiKey) => `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    
    transformRequest: (contextPromt, question) => ({ 
      contents: [{ parts: [{ text: contextPromt + "\n User question:" + question }] }]
    }),

    transformResponse: (response) => response.data.candidates[0]?.content?.parts[0]?.text
  },
  empathyQwen: {
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
  },
  empathyMistral: {
    url: () => 'https://empathyai.prod.empathy.co/v1/chat/completions',
    transformRequest: (contextPromt, question) => ({
      model: "mistralai/Mistral-7B-Instruct-v0.3",
      messages: [
        { role: "system", content: contextPromt },
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

  //Validacion especifica de los campos
  const { userQuestion, gameQuestion, answers, correctAnswer } = req.body;

  if (typeof userQuestion !== 'string') {
    throw new Error('userQuestion must be a string');
  }

  if (typeof gameQuestion !== 'string' || gameQuestion.trim() === '') {
    throw new Error('gameQuestion must be a non-empty string');
  }

  if (!Array.isArray(answers)) {
    throw new Error('answers must be an array');
  }

  if (answers.length > 4) {
    throw new Error('answers length is not valid');
  }

  for (let i = 0; i < answers.length; i++) {
    if (typeof answers[i] !== 'string' || answers[i].trim() === '') {
      throw new Error(`Answer at position ${i} must be a non-empty string`);
    }
  }

  if (typeof correctAnswer === 'number') {
    if (!Number.isInteger(correctAnswer) || correctAnswer < 0 || correctAnswer >= answers.length) {
      throw new Error(`correctAnswer as index must be a valid integer between 0 and ${answers.length - 1}`);
    }
  } 

}

//validacion del input puesto por el usuario
function validateUserInput(req) {
  
  const result = {
    isValid: true,
    message: null,
    friendlyMessage: null
  };

  const { userQuestion } = req.body;
  
  //no esté vacío
  if (!userQuestion || userQuestion.trim() === '') {
    result.isValid = false;
    result.message = 'User question cannot be empty';
    result.friendlyMessage = "It seems you didn't ask a specific question. Could you please rephrase your query?";
    return result;
  }

  //longitud mínima
  if (userQuestion.trim().length < 6) {
    result.isValid = false;
    result.message = 'User question is too short (minimum 3 characters)';
    result.friendlyMessage = "Your question is a bit too short. Could you provide more details about what you'd like to know?";
    return result;
  }

  //longitud máxima
  if (userQuestion.length > 300) {
    result.isValid = false;
    result.message = 'User question is too long (maximum 300 characters)';
    result.friendlyMessage = "Your question is quite long! Could you keep it shorter and more specific?";
    return result;
  }

  //casos de preguntas a evitar (preguntas que piden la respuesta directamente)
  const forbiddenPatterns = [
    /^\s*tell\s+me\s+the\s+answer\s*$/i, 
    /^what\s+is\s+the\s+correct\s+answer/i,
    /^which\s+is\s+correct/i,
    /^give\s+me\s+the\s+answer/i
  ];

  const containsForbiddenPattern = forbiddenPatterns.some(pattern => 
    pattern.test(userQuestion)
  );
  
  if (containsForbiddenPattern) {
    result.isValid = false;
    result.message = 'Direct answer requests are not allowed';
    result.friendlyMessage = "I can't give you the answer directly. Try asking about the topic or concepts related to the question instead.";
    return result;
  }


  return result;
}

// Generic function to send questions to LLM
async function sendQuestionToLLM(contextPromt, question, apiKey, model) {
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

    //const response = await axios.post(url, requestData, { headers });
    //return config.transformResponse(response);

    const response = await axios.post(url, requestData, { 
      headers,
      timeout: 12000  // 12 segundos de timeout
    });

    const processedResponse = config.transformResponse(response);
    
    // Verificar que la respuesta no sea vacía
    if (!processedResponse) {
      throw new Error('Empty response from LLM service');
    }
    
    return processedResponse;

  } catch (error) {
    console.error(`Error sending question to ${model}:`, error.message || error);

    //Comprobacion para ver si hubo respuesta, y si informacion
    if (error.response) {
      console.error(`Response data: ${JSON.stringify(error.response.data)}`);
      console.error(`Response status: ${error.response.status}`);
    }


    //Cambio de modelo
    LLM_MODELS.ACTUAL = MODEL_FAILOVER_ORDER.find(model => model !== LLM_MODELS.ACTUAL) || LLM_MODELS.PRIMARY;

    //return null;
    throw error; //para luego tratarlo mejor en el post ask
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
    validateRequiredFields(req);

    //Validate user input
    const validationResult = validateUserInput(req);
    if (!validationResult.isValid) {
      return res.status(200).json({ 
        answer: validationResult.friendlyMessage,
        validationError: true
      });
    }

    const { userQuestion, gameQuestion, answers, correctAnswer } = req.body;

    //const model = 'empathyMistral';
    const model = LLM_MODELS.ACTUAL;


    let apiKey = process.env.LLM_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'LLM_API_KEY IS NOT FOUND.' });
    }

    // Configura el contexto con toda la información disponible
    const contextPromt = configureContextPromt(gameQuestion, answers, correctAnswer);

    try {
      const answer = await sendQuestionToLLM(contextPromt, userQuestion, apiKey, model);

      res.json({ answer });

    } catch (llmError) {
      
      return res.status(200).json({ 
        answer: "I'm currently having trouble processing questions. Try again later.",
        serviceError: true
      });
    }

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const server = app.listen(port, () => {
  console.log(`LLM Service listening at http://localhost:${port}`);
});

module.exports = server


