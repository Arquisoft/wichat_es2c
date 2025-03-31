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
    console.error('Error al cargar la documentación Swagger:', e);
  }

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';
mongoose.connect(mongoUri);


app.get('/userinfo', async (req, res) => {
    try {
        console.log('Intentando recuperar usuarios directamente desde la colección...');
        const users = await mongoose.connection.db.collection('users').find().toArray();
        console.log(`Encontrados ${users.length} usuarios directamente`);

        const safeUsers = users.map(user => {
            const { password, ...userData } = user;
            return userData;
        });

        res.json(safeUsers);
    } catch (error) {
        console.error('Error al recuperar usuarios directamente:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/userinfo/:username', async (req, res) => {
    try {
        const username = req.params.username;
        console.log(`Buscando usuario con username: ${username}`);

        const user = await mongoose.connection.db.collection('users').findOne({ username });

        if (!user) {
            console.log(`Usuario con username ${username} no encontrado`);
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        console.log(`Usuario ${username} encontrado`);

        const { password, ...userData } = user;

        res.json(userData);
    } catch (error) {
        console.error(`Error al buscar usuario ${req.params.username}:`, error);
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