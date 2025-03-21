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

    //Actualizo las estadisticas del jugador
    user.statistics.gamesPlayed++;
    user.statistics.averageScore = (user.statistics.averageScore * (user.statistics.gamesPlayed - 1) + lastMatch.score) / user.statistics.gamesPlayed; //deshago el calculo de la media para hacerlo con lo nuevo
    user.statistics.bestScore = Math.max(user.statistics.bestScore, lastMatch.score);
    user.statistics.averageTime = formatTime((user.statistics.averageTime * (user.statistics.gamesPlayed - 1) + lastMatch.time) / user.statistics.gamesPlayed);
    user.statistics.bestTime = formatTime(Math.min(user.statistics.bestTime, lastMatch.time));
    user.statistics.rightAnswers += lastMatch.questions.reduce((sum, question) => sum + question.answers.filter(answer => answer.selected && answer.correct).length, 0);
    user.statistics.wrongAnswers += lastMatch.questions.reduce((sum, question) => sum + question.answers.filter(answer => answer.selected && !answer.correct).length, 0);
    


    await user.save();

    res.status(201).json({ message: 'Match actualizado'});

  } catch (error) {
    console.error("Error al añadir el match:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

const formatTime = (seconds) => { //funcion extra para pasar de segundos a horas y minutos, cuestion de presentacion
  if (!seconds || seconds <= 0) return "0h 0m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};


//sacar las partidas de un usuario
        //ACTUALIZAR PARA QUE NO SAQUE TODOS, SOLO CIERTO NUMERO EN BASE A LA PAGINACION

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
        wrongAnswers

        /*  Corresponderia al boton Ver preguntas, no aqui
        questions: match.questions.map(q => ({
          text: q.text,
          answers: q.answers.map(a => ({
            text: a.text,
            selected: a.selected,
            correct: a.correct
          }))
        }))
          */
      };
    });
      
    
    res.json({  //DEVUELTO TANTO LAS ESTADISTICAS COMO LAS PARTIDAS
      matches: formattedMatches,
      statistics: user.statistics
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
