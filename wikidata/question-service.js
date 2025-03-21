const express = require("express");
const cors = require("cors");
const { generateQuestion } = require('./question-Generator'); // Importa la función generadora de preguntas
const app = express();

const PORT = 3005;
app.use(cors());
app.use(express.json());

// Ruta para obtener una pregunta
app.get('/question', async (req, res) => {
    try {
        // Obtener el tipo de pregunta desde los parámetros de la solicitud
        const questionType = req.query.type; // Si no se especifica, usa un valor por defecto
        const question = await generateQuestion(questionType); // Pasar el tipo de pregunta
        res.json(question);
    } catch (error) {
        console.error("Error generating question:", error);
        res.status(500).json({ error: 'Failed to generate question' });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Question Service running on port ${PORT}`);
});