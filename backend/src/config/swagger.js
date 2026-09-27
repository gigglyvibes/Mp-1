const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Geo-Based Micro Job Platform API",
      version: "1.0.0",
      description:
        "REST API documentation for the Geo-Based Micro Job Platform connecting Business Owners with Students for temporary micro jobs.",
    },
    servers: [{ url: "/api/v1", description: "Base API path" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerJSDoc(options);
