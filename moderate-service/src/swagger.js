// src/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'CO3404 Moderate Service API',
      version:     '1.0.0',
      description: 'Distributed Systems Assignment — Moderate Microservice (requires authentication)',
    },
    servers: [
      { url: 'http://localhost:3003', description: 'Local development' },
      { url: 'http://moderate-service:3003', description: 'Docker network' }
    ],
    components: {
      schemas: {
        PendingJoke: {
          type: 'object',
          required: ['setup', 'punchline', 'type'],
          properties: {
            setup:       { type: 'string', example: "Why don't scientists trust atoms?" },
            punchline:   { type: 'string', example: "Because they make up everything!" },
            type:        { type: 'string', example: 'general' },
            submittedAt: { type: 'string', format: 'date-time' }
          }
        }
      },
      securitySchemes: {
        oidc: {
          type: 'openIdConnect',
          openIdConnectUrl: `https://${process.env.AUTH0_DOMAIN}/.well-known/openid-configuration`
        }
      }
    }
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
