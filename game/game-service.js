const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { Match, Answer, User,Question } = require('./game-model');
const app = express();
const port = 8004;
const cors = require('cors');
app.use(cors());
app.use(express.json());

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';
mongoose.connect(mongoUri);


app.post('/addQuestion', async (req, res) => {
  try {
    const { username, question, selectedAnswer,questions,answers } = req.body;

    if (!username || !question || !selectedAnswer || !questions || !answers) {
      return res.status(400).json({ error: "Error when processing the request" });
    }

    const user = await User.findOne({ username });

    if (!user || user.matches.length === 0) {
      return res.status(404).json({ error: "User or match not found" });
    }
    const lastMatch = user.matches[user.matches.length - 1]; //debería ser siempre la que está en curso

    const newQuestion = {
      text: question,
      answers: answers.map((option, index) => ({
        text: option,
        selected: option === selectedAnswer,
        correct: index === questions[0].correctAnswer
      }))
    };

    lastMatch.questions.push(newQuestion);

    await user.save();

    res.status(201).json({ message: "Pregunta añadida al último match", match: lastMatch });

  } catch (error) {
    console.error("Error al añadir pregunta al match:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});



app.post('/addMatch', async (req, res) => {
  try {
    const { username} = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const newMatch = new Match({

    });

    user.matches.push(newMatch);

    await user.save();

    res.status(201).json({ message: 'Match agregado correctamente', match: newMatch });

  } catch (error) {
    console.error("Error al añadir el match:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


app.post('/endMatch', async (req, res) => {
  try {
    const { username } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const lastMatch = user.matches[user.matches.length - 1]; //debería ser siempre la que está en curso

    lastMatch.date = new Date();
    lastMatch.time = req.body.time;
    lastMatch.score = lastMatch.time * 100;
    await user.save();

    res.status(201).json({ message: 'Match actualizado'});

  } catch (error) {
    console.error("Error al añadir el match:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


//sacar las partidas de un usuario Y su info
app.get('/userMatches', async (req, res) => {
  try {
    const username = req.query.username;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    //Saco las partidas y, ademas, calcular estadísticas generales
    const formattedMatches = user.matches.map(match => {
      // Calcular respuestas correctas e incorrectas
      let correctAnswers = 0;
      let wrongAnswers = 0;
      
      match.questions.forEach(question => {
        question.answers.forEach(answer => {
          if (answer.selected) {
            if (answer.correct) {
              correctAnswers++;
            } else {
              wrongAnswers++;
            }
          }
        });
      });
      
      return {
        id: match._id,
        date: match.date,
        time: match.time || 0,
        score: match.score || 0,
        correctAnswers,
        wrongAnswers,
        questions: match.questions.map(q => ({
          text: q.text,
          answers: q.answers.map(a => ({
            text: a.text,
            selected: a.selected,
            correct: a.correct
          }))
        }))
      };
    });
    
    res.json({ matches: formattedMatches });
  } catch (error) {
    console.error('Error al obtener partidas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// Start the server
const server = app.listen(port, () => {
  console.log(`Game Service listening at http://localhost:${port}`);
});

server.on('close', () => {
    // Close the Mongoose connection
    mongoose.connection.close();
  });

module.exports = server
