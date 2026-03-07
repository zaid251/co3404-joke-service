// src/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'CO3404 Submit Service API',
      version:     '1.0.0',
      description: 'Distributed Systems Assignment – Submit Microservice API Documentation',
    },
    servers: [
      { url: 'http://localhost:3002', description: 'Local development' },
      { url: 'http://submit-service:3002', description: 'Docker network' }
    ],
    components: {
      schemas: {
        NewJoke: {
          type: 'object',
          required: ['setup', 'punchline', 'type'],
          properties: {
            setup:     { type: 'string', example: "Why did the chicken cross the road?" },
            punchline: { type: 'string', example: "To get to the other side!" },
            type:      { type: 'string', example: 'general' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
