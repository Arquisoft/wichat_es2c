const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const yaml = require('js-yaml');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 8005;

app.use(cors());
app.use(express.json());

try {
    const swaggerDocument = yaml.load(fs.readFileSync('./swagger.yaml', 'utf8'));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    console.log('Swagger UI disponible en /api-docs');
} catch (e) {
    console.error('Error loading Swagger documentation:', e);
}

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';
mongoose.connect(mongoUri);


app.get('/userinfo', async (req, res) => {
    try {
        const users = await mongoose.connection.db.collection('users').find().toArray();

        const safeUsers = users.map(user => {
            const { password, __v, ...userData } = user;
            return userData;
        });

        res.json(safeUsers);
    } catch (error) {
        console.error('Error searching for users:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/userinfo/:username', async (req, res) => {
    try {
        const username = req.params.username;

        const user = await mongoose.connection.db.collection('users').findOne({ username });

        if (!user) {
            console.log(`User ${username} not found`);
            return res.status(404).json({ error: 'User not found' });
        }

        const { password, __v, ...userData } = user;

        res.json(userData);
    } catch (error) {
        console.error(`Error searching for user ${req.params.username}:`, error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/userinfo/matches/:username', async (req, res) => {
    try {
        const username = req.params.username;

        const user = await mongoose.connection.db.collection('users').findOne({ username });

        if (!user) {
            console.log(`User ${username} not found`);
            return res.status(404).json({ error: 'User not found' });
        }

        const matches = await mongoose.connection.db.collection('matches')
            .find({ username })
            .sort({ date: -1 })
            .toArray();

            const formattedMatches = matches.map(match => {
                let correctAnswers = 0;
                let wrongAnswers = 0;
    
                // Contar respuestas correctas e incorrectas
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
                    username: match.username,
                    date: match.date,
                    time: match.time,
                    score: match.score,
                    difficulty: match.difficulty,
                    correctAnswers,
                    wrongAnswers,
                    questions: match.questions
                };
            });

        res.json(formattedMatches);
    } catch (error) {
        console.error(`Error searching for matches of the user ${req.params.username}:`, error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/userinfo/ranking/bestScore', async (req, res) => {
    try {
        const users = await mongoose.connection.db.collection('users')
            .find({
                "statistics.bestScore": { $exists: true }
            })
            .sort({ "statistics.bestScore": -1 })
            .limit(5)
            .toArray();

        const rankingUsers = users.map((user, index) => {
            const { password, __v, ...safeUserData } = user;
            return {
                rank: index + 1,
                ...safeUserData
            };
        });
        res.json(rankingUsers);
    } catch (error) {
        console.error('Error generating best score ranking:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/userinfo/ranking/morePlayed', async (req, res) => {
    try {
        const users = await mongoose.connection.db.collection('users')
            .find({
                "statistics.gamesPlayed": { $exists: true }
            })
            .sort({ "statistics.gamesPlayed": -1 })
            .limit(5)
            .toArray();

        const rankingUsers = users.map((user, index) => {
            const { password, __v, ...safeUserData } = user;
            return {
                rank: index + 1,
                ...safeUserData
            };
        });
        res.json(rankingUsers);
    } catch (error) {
        console.error('Error generating more played ranking:', error);
        res.status(500).json({ error: error.message });
    }
});

const server = app.listen(port, () => {
    console.log(`UserInfo Service listening at http://localhost:${port}`);
});

// Listen for the 'close' event on the Express.js server
server.on('close', () => {
    // Close the Mongoose connection
    mongoose.connection.close();
});

module.exports = server;