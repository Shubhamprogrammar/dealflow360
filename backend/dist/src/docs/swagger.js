import swaggerJSDoc from 'swagger-jsdoc';
export const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: '3.0.3',
        info: { title: 'Backend Starter API', version: '1.0.0' },
        servers: [{ url: '/api/v1' }],
        components: {
            securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
        },
    },
    apis: [],
});
