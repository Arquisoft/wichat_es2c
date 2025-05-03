# wichat_es2c
 
[![Actions Status](https://github.com/arquisoft/wichat_es2c/workflows/CI%20for%20wichat_es2c/badge.svg)](https://github.com/arquisoft/wichat_es2c/actions)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_wichat_es2c&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Arquisoft_wichat_es2c)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_wichat_es2c&metric=coverage)](https://sonarcloud.io/summary/new_code?id=Arquisoft_wichat_es2c)

[![Logo](/webapp/public/wiChatLogos/LogoWichat2_192.png)](http://wic2c.duckdns.org/)

<div align="center">
<img src="/webapp/public/homePicture.png" height="300">
</div>

This is a base project for the Software Architecture course in 2024/2025.
WiChat is an application focused on allowing its users to play a quiz-style game on various topics, in which they can achieve their best results with the help of a chatbot powered by an Artificial Intelligence model. This data is then stored and can be accessed at any time, including both the user’s own data and global data from other players.

## Team Members
👤Contributor | 🌐Git Account | 📧Contact Email
-- | -- | --
Pelayo García Varela | <a href="https://github.com/ElPandaP"><img src="https://img.shields.io/badge/Pelayo_García-green"></a> | UO294381@uniovi.es
Pablo Pérez Álvarez | <a href="https://github.com/latiose"><img src="https://img.shields.io/badge/Pablo_Pérez-red"></a> | UO294197@uniovi.es
Lucas Gisbert López | <a href="https://github.com/LucasGisb"><img src="https://img.shields.io/badge/Lucas_Gisbert-blue"></a> | UO295526@uniovi.es
Héctor Hernández Iglesias | <a href="https://github.com/HernandezIglesiasHector"><img src="https://img.shields.io/badge/Héctor_Hernández-purple"></a> | UO296095@uniovi.es

## Application summary

### Main Functionality: Matches system

- **Time trial matches**. Matches begin with a time limit, which starts to decrease as soon as the game begins. The game ends when the time reaches zero. It's up to the user to extend the game by answering questions correctly, since each correct answer adds time, while each incorrect answer deducts time.

- **Different difficulty modes**. When starting a match, the player can choose the difficulty level of the game, selecting between:
  - **Normal Difficulty**: higher time limit, and correct answers will add more time, while the penalty for wrong answers will be less significant. However, the final score based on hits and misses will tend to be lower.
  - **Hard Difficulty**: lower time limit, and correct answers will add less time, while wrong answers will subtract more significantly. However, the final score based on hits and misses will tend to be higher.

- **Different topics**. Besides the difficulty level, the player can also choose the theme of the questions for the match, selecting from the following topics: **Birds, Cartoons, Flags, and Sports**.

- **Chatbot that provides hints during the game**. During the match, the user has access to a ChatBot that, upon request, will provide the most effective hints regarding the current question.


### Other Application Features

- **User login/registration system**. Users can register within the application to gain access to specific functionalities and to keep track of their different game sessions.

- **User's own game history and statistics**. A user with a registered account in the application can view their game history and the statistics generated based on it.

- **User match ranking and search tool**. Any user can access the Leaderboard page, where the top scoring users and those with the most matches are displayed. There is also a search tool to find matches played by a specific user.


### Video

**PONER ENLACE AL VIDEO DEMO AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA**

## System Arquitecture

The application is composed of several components.

- **User service**. Express service that handles the insertion of new users in the system.
- **Auth service**. Express service that handles the authentication of users.
- **LLM service**. Express service that handles the communication with the LLM.
- **User info API**. Express service that provides information about the application.
- **Game service**. Express service that handles the matches management.
- **Question service**. Express service that generates the system questions based of Wikidata.
- **Gateway service**. Express service that is exposed to the public and serves as a proxy to the two previous ones.
- **Webapp**. React web application that uses the gateway service to allow basic login and new user features.

Both the user and auth service share a Mongo database that is accessed with mongoose.

## Deployment


## Useful links
Link to the website -> http://wic2c.duckdns.org/
Link to project documentation -> https://arquisoft.github.io/wichat_es2c/
Link to API documentation ->
