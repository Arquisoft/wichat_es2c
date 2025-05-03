# wichat_es2c
 
[![Actions Status](https://github.com/arquisoft/wichat_es2c/workflows/CI%20for%20wichat_es2c/badge.svg)](https://github.com/arquisoft/wichat_es2c/actions)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_wichat_es2c&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Arquisoft_wichat_es2c)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_wichat_es2c&metric=coverage)](https://sonarcloud.io/summary/new_code?id=Arquisoft_wichat_es2c)

[![Logo](/webapp/public/wiChatLogos/LogoWichat2_192.png)](http://wic2c.duckdns.org/)

Link to the website -> http://wic2c.duckdns.org/

WiChat is an application focused on allowing its users to play a quiz-style game on various topics, in which they can achieve their best results with the help of a chatbot powered by an Artificial Intelligence model. This data is then stored and can be accessed at any time, including both the user’s own data and global data from other players.

## Team Members
👤Contributor | 🌐Git Account | 📧Contact Email
-- | -- | --
Pelayo García Varela | <a href="https://github.com/ElPandaP"><img src="https://img.shields.io/badge/Pelayo_García-green"></a> | UO294381@uniovi.es
Pablo Pérez Álvarez | <a href="https://github.com/latiose"><img src="https://img.shields.io/badge/Pablo_Pérez-red"></a> | UO294197@uniovi.es
Lucas Gisbert López | <a href="https://github.com/LucasGisb"><img src="https://img.shields.io/badge/Lucas_Gisbert-blue"></a> | UO295526@uniovi.es
Héctor Hernández Iglesias | <a href="https://github.com/HernandezIglesiasHector"><img src="https://img.shields.io/badge/Héctor_Hernández-purple"></a> | UO296095@uniovi.es

## Introduction

This is a base project for the Software Architecture course in 2024/2025. It is a basic application composed of several components.

- **User service**. Express service that handles the insertion of new users in the system.
- **Auth service**. Express service that handles the authentication of users.
- **LLM service**. Express service that handles the communication with the LLM.
- **Gateway service**. Express service that is exposed to the public and serves as a proxy to the two previous ones.
- **Webapp**. React web application that uses the gateway service to allow basic login and new user features.

Both the user and auth service share a Mongo database that is accessed with mongoose.
