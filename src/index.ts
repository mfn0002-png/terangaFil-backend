import 'dotenv/config';
import fastify from 'fastify';
import { serializerCompiler, validatorCompiler, ZodTypeProvider, jsonSchemaTransform } from 'fastify-type-provider-zod';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyJwt from '@fastify/jwt';
import { userRoutes } from './interfaces/http/routes/userRoutes.js';
import { authRoutes } from './interfaces/http/routes/authRoutes.js';
import { supplierRoutes } from './interfaces/http/routes/supplierRoutes.js';
import { catalogRoutes } from './interfaces/http/routes/catalogRoutes.js';
import { orderRoutes } from './interfaces/http/routes/orderRoutes.js';
import { adminRoutes } from './interfaces/http/routes/adminRoutes.js';
import { premiumRoutes } from './interfaces/http/routes/premiumRoutes.js';
import { favoriteRoutes } from './interfaces/http/routes/favoriteRoutes.js';
import { paymentRoutes } from './interfaces/http/routes/paymentRoutes.js';
import fastifyCors from '@fastify/cors';


const app = fastify({
  bodyLimit: 30 * 1024 * 1024, // 30MB
}).withTypeProvider<ZodTypeProvider>();

// Configuration JWT
app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'dev-secret-key-change-me',
});

// Configuration Zod
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Configuration Swagger
app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Teranga-Fil API',
      description: 'API de la marketplace de mercerie Teranga-Fil',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  transform: jsonSchemaTransform,
});

app.register(fastifyCors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

app.register(fastifySwaggerUi, {
  routePrefix: '/docs',
});

// Enregistrement des routes
app.register(authRoutes);
app.register(userRoutes);
app.register(supplierRoutes);
app.register(catalogRoutes);
app.register(orderRoutes);
app.register(adminRoutes);
app.register(premiumRoutes);
app.register(favoriteRoutes);
app.register(paymentRoutes);

// Route de santé (Health Check)
app.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString(), node: process.version };
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Serveur démarré sur http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
