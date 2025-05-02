// user-service.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./user-model')

const app = express();
const port = 8001;

// Middleware to parse JSON in request body
app.use(express.json());

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';
mongoose.connect(mongoUri);



// Function to validate required fields in the request body
function validateRequiredFields(req, requiredFields) {
    for (const field of requiredFields) {
      if (!(field in req.body)) {
        throw new Error(`Missing required field: ${field}`);
      }

    }

    if (req.body.username.length < 3) {
        throw new Error(`Username length must be at least 3`);
    }

    if (req.body.password.length < 4 ) {
      throw new Error(`Password length must be at least 4`);
  }

    if (req.body.username.length > 20||
        req.body.password.length > 20 ) {
        throw new Error(`Username and password length must be at most 20`);
    }

    const passwordCheck = validatePasswordComplexity(req.body.password);
    if (!passwordCheck.valid) {
      throw new Error(passwordCheck.message);
    }

}

//Function to validate password complexity
function validatePasswordComplexity(password) {
  const hasNumber = /\d/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const hasNoSpaces = !/\s/.test(password);
  
  if (!hasNumber || !hasLowercase || !hasUppercase || !hasSpecialChar || !hasNoSpaces) {
    return { 
      valid: false, 
      message: "Password requirements: " +
               "Must contain at least one number, " +
               "one lowercase letter, " +
               "one uppercase letter, " +
               "one special character and " +
               "no spaces"
    };
  }
  
  return { valid: true, message: "Password meets complexity requirements" };
}

app.post('/adduser', async (req, res) => {
    try {
        // Check if required fields are present in the request body
        validateRequiredFields(req, ['username', 'password']);
        const existingUser = await User.findOne({ username: req.body.username.toString() });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        // Encrypt the password before saving it
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const newUser = new User({
            username: req.body.username,
            password: hashedPassword,
        });
        await newUser.save();
        res.json(newUser);
    } catch (error) {
        res.status(400).json({ error: error.message }); 
    }});

const server = app.listen(port, () => {
  console.log(`User Service listening at http://localhost:${port}`);
});



// Listen for the 'close' event on the Express.js server
server.on('close', () => {
    // Close the Mongoose connection
    mongoose.connection.close();
  });

module.exports = server