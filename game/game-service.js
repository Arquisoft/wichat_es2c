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
    const { username, question, selectedAnswer, correctAnswer, answers } = req.body;

    if (!username || !question || !selectedAnswer || correctAnswer === undefined || !answers) {
      return res.status(400).json({ error: "Error when processing the request" });
    }

    const user = await User.findOne({ username });

    if (!user || user.matches.length === 0) {
      return res.status(404).json({ error: "User or match not found" });
    }

    const lastMatch = user.matches[user.matches.length - 1];

    const newQuestion = {
      text: String(question),
      answers: answers.map((option, index) => ({
        text: option,
        selected: option === selectedAnswer,
        correct: index === correctAnswer
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
    const { username, difficulty } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const newMatch = new Match({
    difficulty:difficulty
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

    const lastMatch = user.matches[user.matches.length - 1]; // Última partida

    if (!lastMatch) {
      return res.status(404).json({ error: 'No se encontró una partida activa' });
    }

    const correctAnswers = lastMatch.questions.filter(q =>
        q.answers.some(answer => answer.selected && answer.correct)
    ).length;

    const incorrectAnswers = lastMatch.questions.length - correctAnswers;

    lastMatch.date = new Date();
    lastMatch.time = req.body.time;

    lastMatch.score = (lastMatch.difficulty * (correctAnswers * 30)) - (incorrectAnswers * 20);

    await user.save();

    res.status(201).json({ message: 'Match actualizado', score: lastMatch.score });

  } catch (error) {
    console.error("Error al finalizar el match:", error);
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
