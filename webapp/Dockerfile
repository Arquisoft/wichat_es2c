FROM node:22

COPY . /app
WORKDIR /app

#Install the dependencies
RUN npm install

ARG API_URI="http://143.47.54.63:8000"
ARG LLM_API_KEY
ENV REACT_APP_API_ENDPOINT=$API_URI
ENV REACT_APP_LLM_API_KEY=$LLM_API_KEY

#Create an optimized version of the webapp
RUN npm run build
RUN npm install serve

#Execute npm run prod to run the server
CMD [ "npm", "run", "prod" ]
#CMD ["npm", "start"]
