import path from "path";
import swaggerJSDoc, { type SwaggerDefinition } from "swagger-jsdoc";
import { SwaggerOptions } from "swagger-ui-express";

const swaggerDefinition: SwaggerDefinition = {
    openapi: "3.0.1",
    info: {
        title: "OYeah Escrow!",
        version: "0.1.0",
        description: "The API documentation for Oyeah Escrow ecommerce platform"
    },
    servers: [
        {
            url: "http://localhost:4001"
        }
    ]
};


const options: SwaggerOptions = {
    swaggerDefinition,
    apis: [path.join(__dirname, "../../docs/**/*.yaml")]
}

const swaggerSpec = swaggerJSDoc(options);


export default swaggerSpec;