const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { Match, User } = require('./game-model');
const app = express();
const port = 8004;
const cors = require('cors');
app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';
mongoose.connect(mongoUri);

app.post('/addQuestion', async (req, res) => {
  try {
    const { username, question, correctAnswer, answers, selectedAnswer } = req.body;

    if (!username || !question || !selectedAnswer || correctAnswer === undefined || !answers) {
      return res.status(400).json({ error: "Error when processing the request" });
    }
    const lastMatch = await Match.findOne({ username }).sort({ date: 1 });

    if (!lastMatch) {
      return res.status(404).json({ error: "Match not found" });
    }

    const newQuestion = {
      text: String(question),
      answers: answers.map((option, index) => {
        return {
          text: option,
          selected: option === selectedAnswer,
          correct: index === correctAnswer,
        };
      })
    };

    lastMatch.questions.push(newQuestion);
    await lastMatch.save();

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
      difficulty: difficulty,
      username: username,
      questions: []
    });

    await newMatch.save();

    res.status(201).json({ message: 'Match agregado correctamente', match: newMatch });

  } catch (error) {
    console.error("Error al añadir el match:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/endMatch', async (req, res) => {
  try {
    const { username, time } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const lastMatch = await Match.findOne({ username }).sort({ date: 1 });
    if (!lastMatch) {
      return res.status(404).json({ error: 'No se encontró una partida activa' });
    }

    const questionsWithCorrectAnswers = lastMatch.questions.filter(q => {
      const hasCorrectSelected = q.answers.some(answer => {
        return answer.selected && answer.correct;
      });
      return hasCorrectSelected;
    });

    const correctAnswers = questionsWithCorrectAnswers.length;
    const incorrectAnswers = lastMatch.questions.length - correctAnswers;

    lastMatch.date = new Date();
    lastMatch.time = time;
    lastMatch.score = (lastMatch.difficulty * (correctAnswers * 30)) - (incorrectAnswers * 20);

    await lastMatch.save();

    if (!user.statistics) {
      user.statistics = {
        gamesPlayed: 1,
        averageScore: lastMatch.score,
        bestScore: lastMatch.score,
        averageTime: lastMatch.time,
        bestTime: lastMatch.time,
        rightAnswers: correctAnswers,
        wrongAnswers: incorrectAnswers
      };
    } else {
      user.statistics.gamesPlayed++;
      user.statistics.averageScore = ((user.statistics.averageScore * (user.statistics.gamesPlayed - 1) + lastMatch.score) / user.statistics.gamesPlayed).toFixed(2);
      user.statistics.bestScore = Math.max(user.statistics.bestScore, lastMatch.score).toFixed(2);
      user.statistics.averageTime = ((user.statistics.averageTime * (user.statistics.gamesPlayed - 1) + lastMatch.time) / user.statistics.gamesPlayed).toFixed(2);
      user.statistics.bestTime = Math.max(user.statistics.bestTime || 0, lastMatch.time);
      user.statistics.rightAnswers += correctAnswers;
      user.statistics.wrongAnswers += incorrectAnswers;
    }

    await user.save();

    res.status(201).json({ message: 'Match actualizado', score: lastMatch.score });

  } catch (error) {
    console.error("Error al finalizar el match:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

const formatTime = (seconds) => {
  if (!seconds || seconds <= 0) return "0h 0m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

app.get('/userStatistics', async (req, res) => {
  try {
    const username = req.query.username;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      statistics: user.statistics
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/userMatches', async (req, res) => {
  try {
    const username = req.query.username;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const matchQuery = { username, date: { $ne: null } };

    const totalMatches = await Match.countDocuments(matchQuery);
    const totalPages = Math.ceil(totalMatches / limit);

    const matches = await Match.find(matchQuery)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    const formattedMatches = matches.map(match => {
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
        wrongAnswers,
        questions: match.questions || []
      };
    });

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


const server = app.listen(port, () => {
  console.log(`Game Service listening at http://localhost:${port}`);
});

server.on('close', () => {
  // Close the Mongoose connection
  mongoose.connection.close();
});

module.exports = server;