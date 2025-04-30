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
if (mongoose.connection.readyState === 0) {
  mongoose.connect(mongoUri);
}


function validateMatchData(data) {
  const errors = [];
  
  const requiredFields = ['username', 'difficulty', 'question', 'selectedAnswer', 'correctAnswer', 'time', 'endTime', 'answers'];
  requiredFields.forEach(field => {
    if (data[field] === undefined || data[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  //Si faltan campos, devolver errores temprano (tipo de error mas basica y debe identificarse antes de validar los tipos de datos)
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  

  // Validación de tipos de datos
  if (typeof data.username !== 'string' || data.username.trim() === '') {
    errors.push('Username must be a non-empty string');
  }
  if (!Number.isInteger(data.difficulty) || ![1, 2].includes(data.difficulty)) {
    errors.push('Difficulty must be either 1 (normal) or 2 (hard)');
  }
  if (typeof data.question !== 'string' || data.question.trim() === '') {
    errors.push('Question must be a non-empty string');
  }
  if (typeof data.selectedAnswer !== 'string' || data.selectedAnswer.trim() === '') {
    errors.push('Selected answer must be a non-empty string');
  }
  if (!Number.isFinite(data.time) || data.time <= 0) {
    errors.push('Time must be a positive number');
  }
  if (!Number.isInteger(data.correctAnswer) || data.correctAnswer < 0 || data.correctAnswer > 3) {
    errors.push('Correct answer must be a non-negative integer and less than 4');
  }
  
  if (!Array.isArray(data.answers) || data.answers.length === 0) {
    errors.push('Answers must be a non-empty array');
  } else {
    // Verificar que correctAnswer sea un índice válido dentro del array de respuestas
    if (data.correctAnswer >= data.answers.length) {
      errors.push('Correct answer index is out of bounds');
    }
    
    if (data.answers.some(answer => typeof answer !== 'string' || answer.trim() === '')) {
      errors.push('Each answer must be a non-empty string');
    }
  }
  
  if ('isLastQuestion' in data && typeof data.isLastQuestion !== 'boolean') {
    errors.push('isLastQuestion must be a boolean value');
  }
  
  return { 
    valid: errors.length === 0,
    errors 
  };
}

app.post('/addMatch', async (req, res) => {
  try {
    
    //Validacion general sobre el match
    const validationResult = validateMatchData(req.body);
    if (!validationResult.valid) {
      return res.status(400).json({ 
        error: "Invalid match data", 
        details: validationResult.errors 
      });
    }
    
    const { username, difficulty, question, correctAnswer, answers, selectedAnswer, time, endTime,isLastQuestion } = req.body;


    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    let lastMatch = await Match.findOne({ username }).sort({ date: -1 });
    const lastMatchTimestamp = lastMatch ? new Date(lastMatch.date).getTime() : null;
    const endTimeTimestamp = typeof endTime === 'string' ? new Date(endTime).getTime() : endTime;

    if (!lastMatch || lastMatchTimestamp !== endTimeTimestamp) {
      lastMatch = new Match({
        difficulty: difficulty,
        username: username,
        questions: [],
        time: time,
        date: endTime
      });
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
    lastMatch.date = endTime;
    lastMatch.time = time;


    if (isLastQuestion) {
      const questionsWithCorrectAnswers = lastMatch.questions.filter(q => {
        const hasCorrectSelected = q.answers.some(answer => {
          return answer.selected && answer.correct;
        });
        return hasCorrectSelected;
      });

      const correctAnswers = questionsWithCorrectAnswers.length;
      const incorrectAnswers = lastMatch.questions.length - correctAnswers;

      lastMatch.score = ((lastMatch.difficulty * (correctAnswers * 25)) - (incorrectAnswers * 5)|| 0);
      await lastMatch.save();

      if (!user.statistics) {
        user.statistics = {};
      }
      const stats = user.statistics;

      if (!stats.gamesPlayed) {
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
        stats.gamesPlayed++;
        stats.averageScore = ((stats.averageScore * (stats.gamesPlayed - 1) + lastMatch.score) / stats.gamesPlayed).toFixed(2);
        stats.bestScore = Math.max(stats.bestScore, lastMatch.score).toFixed(2);
        stats.averageTime = ((stats.averageTime * (stats.gamesPlayed - 1) + lastMatch.time) / stats.gamesPlayed).toFixed(2);
        stats.bestTime = Math.min(stats.bestTime || Infinity, lastMatch.time);
        stats.rightAnswers += correctAnswers;
        stats.wrongAnswers += incorrectAnswers;
      }

      await User.findByIdAndUpdate(
          user._id,
          { statistics: user.statistics },
          { new: true }
      );

      res.status(201).json({
        message: "Game completed and statistics updated",
        match: lastMatch,
        statistics: user.statistics
      });
    } else {
      await lastMatch.save();
      res.status(201).json({ message: "Question added to match" });
    }

  } catch (error) {
    console.error("Error adding question to match:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


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

process.on('SIGTERM', () => {
  server.close(() => {
    mongoose.connection.close();
  });
});

module.exports = server;