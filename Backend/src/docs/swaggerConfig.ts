import swaggerJsdoc from 'swagger-jsdoc';
import dotenv from 'dotenv';

dotenv.config();

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bacefook API',
      version: '1.0.0',
      description: 'API for the Bacefook application, you get a referral, you get a referral, everyone gets a referral!',
      contact: {
        name: 'Nae',
        email: 'nae.bcc@gmail.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development server',
      },
    ],
    swaggerDefinition: {
        openapi: '3.0.0',
    },
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;