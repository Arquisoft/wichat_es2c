const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const {  Match, Answer, Statistics, User, Question } = require('./game-model');
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
    const { username, question, correctAnswer, answers, selectedAnswer } = req.body;

    if (!username || !question || !selectedAnswer || correctAnswer === undefined || !answers) {
      return res.status(400).json({ error: "Error when processing the request" });
    }

    const user = await User.findOne({ username });

    if (!user || user.matches.length === 0) {
      return res.status(404).json({ error: "User or match not found" });
    }

    const lastMatch = user.matches[user.matches.length - 1];

    /*
    const newQuestion = {
      text: String(question),
      answers: answers.map((option, index) => ({ //option el texto de la respuesta, el index el indice de la actual
        text: option,
        selected: option === selectedAnswer,
        correct: index === correctAnswer
      }))
    };
    */

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

    
    const questionsWithCorrectAnswers = lastMatch.questions.filter(q => {
      const hasCorrectSelected = q.answers.some(answer => {
        return answer.selected && answer.correct;
      });
      return hasCorrectSelected;
    });
    
    const correctAnswers = questionsWithCorrectAnswers.length;
    const incorrectAnswers = lastMatch.questions.length - correctAnswers;


    lastMatch.date = new Date();
    lastMatch.time = req.body.time;
    lastMatch.score = (lastMatch.difficulty * (correctAnswers * 30)) - (incorrectAnswers * 20);

    //Actualizo las estadisticas del jugador
    if (!user.statistics) {
      user.statistics = {
        gamesPlayed: 1,
        averageScore: lastMatch.score,
        bestScore: lastMatch.score,
        averageTime: lastMatch.time,
        bestTime:  lastMatch.time,
        rightAnswers: correctAnswers,
        wrongAnswers: incorrectAnswers
      };
    } else {
      // Asegúrate de que todas las propiedades existan
      user.statistics.gamesPlayed++;
      user.statistics.averageScore = ((user.statistics.averageScore * (user.statistics.gamesPlayed - 1) + lastMatch.score) / user.statistics.gamesPlayed).toFixed(2); //deshago el calculo de la media para hacerlo con lo nuevo
      user.statistics.bestScore = (Math.max(user.statistics.bestScore, lastMatch.score)).toFixed(2);
      user.statistics.averageTime = ((user.statistics.averageTime * (user.statistics.gamesPlayed - 1) + lastMatch.time) / user.statistics.gamesPlayed).toFixed(2);
      user.statistics.bestTime = (Math.max(user.statistics.bestTime, lastMatch.time));
      user.statistics.rightAnswers += lastMatch.questions.reduce((sum, question) => sum + question.answers.filter(answer => answer.selected && answer.correct).length, 0);
      user.statistics.wrongAnswers += lastMatch.questions.reduce((sum, question) => sum + question.answers.filter(answer => answer.selected && !answer.correct).length, 0);
    }

    await user.save();

    res.status(201).json({ message: 'Match actualizado', score: lastMatch.score });

  } catch (error) {
    console.error("Error al finalizar el match:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

const formatTime = (seconds) => { //funcion extra para pasar de segundos a horas y minutos, cuestion de presentacion
  if (!seconds || seconds <= 0) return "0h 0m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};


//sacar las estadisticas de un usuario
app.get('/userStatistics', async (req, res) => {
  try {
    const username = req.query.username;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Devolver solo las estadísticas
    res.json({
      statistics: user.statistics
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

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

// Start the server
const server = app.listen(port, () => {
  console.log(`Game Service listening at http://localhost:${port}`);
});

server.on('close', () => {
    // Close the Mongoose connection
    mongoose.connection.close();
  });

module.exports = server
