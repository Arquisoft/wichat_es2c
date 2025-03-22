// user-service.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./user-model')

const app = express();
const port = 8001;

// Middleware to parse JSON in request body
app.use(express.json());

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';
mongoose.connect(mongoUri);



// Function to validate required fields in the request body
function validateRequiredFields(req, requiredFields) {
    for (const field of requiredFields) {
      if (!(field in req.body)) {
        throw new Error(`Missing required field: ${field}`);
      }

    }

    if (req.body.username.length < 3||
        req.body.password.length < 3 ) {
        throw new Error(`Username and password length must be at least 3`);
    }
}

app.post('/adduser', async (req, res) => {
    try {
        // Check if required fields are present in the request body
        validateRequiredFields(req, ['username', 'password']);
        const existingUser = await User.findOne({ username: req.body.username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        // Encrypt the password before saving it
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const newUser = new User({
            username: req.body.username,
            password: hashedPassword,
        });
        await newUser.save();
        res.json(newUser);
    } catch (error) {
        res.status(400).json({ error: error.message }); 
    }});

const server = app.listen(port, () => {
  console.log(`User Service listening at http://localhost:${port}`);
});


/*
// Obtener las partidas del usuario paginadas
app.get('/userMatches', async (req, res) => {
  try {
    const username = req.query.username;
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Calcular total de partidas y páginas
    const totalMatches = user.matches.length;
    const totalPages = Math.ceil(totalMatches / limit);
    
    // Obtener solo las partidas de la página actual
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMatches = user.matches.slice(startIndex, endIndex);
    
    const formattedMatches = paginatedMatches.map(match => {
      let correctAnswers = 0;
      let wrongAnswers = 0;
      if (match.questions && Array.isArray(match.questions)) {
        match.questions.forEach(question => {
          if (question.answers && Array.isArray(question.answers)) {
            question.answers.forEach(answer => {
              if (answer.selected) {
                if (answer.correct) {
                  correctAnswers++;
                } else {
                  wrongAnswers++;
                }
              }
            });
          }
        });
      }
      
      return {
        id: match._id,
        date: match.date,
        time: match.time,
        score: match.score,
        correctAnswers,
        wrongAnswers
      };
    });
    
    // Devolver datos paginados junto con metadatos de paginación
    res.json({ 
      matches: formattedMatches,
      pagination: {
        totalMatches,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Error al obtener partidas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
*/


// Listen for the 'close' event on the Express.js server
server.on('close', () => {
    // Close the Mongoose connection
    mongoose.connection.close();
  });

module.exports = server