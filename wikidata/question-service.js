const express = require("express");
const cors = require("cors");
const {generateQuestion}= require('./question-Generator');
const {json} = require("express");
const app = express();

const PORT = 3005;
app.use(cors());
app.use (express.json());
app.get('/question', async (req, res) => {
try{
    const question = await generateQuestion();
    res.json(question);
}

catch (error)
{
    res.status(500)-json({ error: 'Failed to generate question' });
}

});
app.listen(PORT, () => {
    console. log(`Question Service running on port ${PORT} `);
});
