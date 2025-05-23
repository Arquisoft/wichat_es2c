# wichat_es2c
 
[![Actions Status](https://github.com/arquisoft/wichat_es2c/workflows/CI%20for%20wichat_es2c/badge.svg)](https://github.com/arquisoft/wichat_es2c/actions)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_wichat_es2c&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Arquisoft_wichat_es2c)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_wichat_es2c&metric=coverage)](https://sonarcloud.io/summary/new_code?id=Arquisoft_wichat_es2c)

[![Logo](/webapp/public/wiChatLogos/LogoWichat2_192.png)](http://wic2c.duckdns.org/)

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

<div align="center">
<img src="/webapp/public/gamePicture.png" height="300">
</div>

### Other Application Features

- **User login/registration system**. Users can register within the application to gain access to specific functionalities and to keep track of their different game sessions.

- **User's own game history and statistics**. A user with a registered account in the application can view their game history and the statistics generated based on it.

<div align="center">
<img src="/webapp/public/historyPicture.png" height="300">
</div>

- **User match ranking and search tool**. Any user can access the Leaderboard page, where the top scoring users and those with the most matches are displayed. There is also a search tool to find matches played by a specific user.

<div align="center">
<img src="/webapp/public/leaderboardPicture.png" height="300">
</div>

### Video

Link to demostration: https://youtu.be/Ej1El-0cOvQ

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




 ## Quick start guide
 
 First, clone the project:
 
 ```git clone git@github.com:arquisoft/wichat_es2c.git```
 
 ### LLM API key configuration
 
 In order to communicate with the LLM integrated in this project, we need to setup an API key. Two integrations are available in this propotipe: gemini and empaphy. The API key provided must match the LLM provider used.
 
 We need to create two .env files. 
 - The first one in the webapp directory (for executing the webapp using ```npm start```). The content of this .env file should be as follows:
 ```
 REACT_APP_LLM_API_KEY="YOUR-API-KEY"
 ```
 - The second one located in the root of the project (along the docker-compose.yml). This .env file is used for the docker-compose when launching the app with docker. The content of this .env file should be as follows:
 ```
 LLM_API_KEY="YOUR-API-KEY"
 ```
 
 Note that these files must NOT be uploaded to the github repository (they are excluded in the .gitignore).
 
 An extra configuration for the LLM to work in the deployed version of the app is to include it as a repository secret (LLM_API_KEY). This secret will be used by GitHub Action when building and deploying the application.
 
 
 ### Launching Using docker
 For launching the propotipe using docker compose, just type:
 ```docker compose --profile dev up --build```
 
 ### Component by component start
 First, start the database. Either install and run Mongo or run it using docker:
 
 ```docker run -d -p 27017:27017 --name=my-mongo mongo:latest```
 
 You can use also services like Mongo Altas for running a Mongo database in the cloud.
 
 Now launch the auth, user and gateway services. Just go to each directory and run `npm install` followed by `npm start`.
 
 Lastly, go to the webapp directory and launch this component with `npm install` followed by `npm start`.
 
 After all the components are launched, the app should be available in localhost in port 3000.
 
 ## Deployment
 For the deployment, we have several options. The first and more flexible is to deploy to a virtual machine using SSH. This will work with any cloud service (or with our own server). Other options include using the container services that all the cloud services provide. This means, deploying our Docker containers directly. Here I am going to use the first approach. I am going to create a virtual machine in a cloud service and after installing docker and docker-compose, deploy our containers there using GitHub Actions and SSH.
 
 ### Machine requirements for deployment
 The machine for deployment can be created in services like Microsoft Azure or Amazon AWS. These are in general the settings that it must have:
 
 - Linux machine with Ubuntu > 20.04 (the recommended is 24.04).
 - Docker installed.
 - Open ports for the applications installed (in this case, ports 3000 for the webapp and 8000 for the gateway service).
 
 Once you have the virtual machine created, you can install **docker** using the following instructions:
 
 ```ssh
 sudo apt update
 sudo apt install apt-transport-https ca-certificates curl software-properties-common
 curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
 sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable"
 sudo apt update
 sudo apt install docker-ce
 sudo usermod -aG docker ${USER}
 ```
 
 ### Continuous delivery (GitHub Actions)
 Once we have our machine ready, we could deploy by hand the application, taking our docker-compose file and executing it in the remote machine. In this repository, this process is done automatically using **GitHub Actions**. The idea is to trigger a series of actions when some condition is met in the repository. The precondition to trigger a deployment is going to be: "create a new release". The actions to execute are the following:
 
 ![imagen](https://github.com/user-attachments/assets/7ead6571-0f11-4070-8fe8-1bbc2e327ad2)
 
 
 As you can see, unitary tests of each module and e2e tests are executed before pushing the docker images and deploying them. Using this approach we avoid deploying versions that do not pass the tests.
 
 The deploy action is the following:
 
 ```yml
 deploy:
     name: Deploy over SSH
     runs-on: ubuntu-latest
     needs: [docker-push-userservice,docker-push-authservice,docker-push-llmservice,docker-push-gatewayservice,docker-push-webapp]
     steps:
     - name: Deploy over SSH
       uses: fifsky/ssh-action@master
       with:
         host: ${{ secrets.DEPLOY_HOST }}
         user: ${{ secrets.DEPLOY_USER }}
         key: ${{ secrets.DEPLOY_KEY }}
         command: |
           wget https://raw.githubusercontent.com/arquisoft/wichat_es2c/master/docker-compose.yml -O docker-compose.yml
           docker compose --profile prod down
           docker compose --profile prod up -d --pull always
 ```
 
 This action uses three secrets that must be configured in the repository:
 - DEPLOY_HOST: IP of the remote machine.
 - DEPLOY_USER: user with permission to execute the commands in the remote machine.
 - DEPLOY_KEY: key to authenticate the user in the remote machine.
 
 Note that this action logs in the remote machine and downloads the docker-compose file from the repository and launches it. Obviously, previous actions have been executed which have uploaded the docker images to the GitHub Packages repository.


## Useful links
- Link to the website -> http://wic2c.duckdns.org/
- Link to project documentation -> https://arquisoft.github.io/wichat_es2c/
- Link to API documentation -> http://wic2c.duckdns.org:8005/api-docs/
