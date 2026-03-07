// src/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'CO3404 Joke Service API',
      version:     '1.0.0',
      description: 'Distributed Systems Assignment – Joke Microservice API Documentation',
      contact: {
        name: 'CO3404 Student'
      }
    },
    servers: [
      { url: 'http://localhost:3001', description: 'Local development' },
      { url: 'http://joke-service:3001', description: 'Docker network' }
    ],
    components: {
      schemas: {
        Joke: {
          type: 'object',
          properties: {
            setup:     { type: 'string', example: "Why don't scientists trust atoms?" },
            punchline: { type: 'string', example: "Because they make up everything!" },
            type:      { type: 'string', example: 'general' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
