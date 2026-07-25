import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import rateLimit from 'express-rate-limit';
import { errorMiddleware } from './core/middlewares/errorMiddleware';

import organizationRoutes from './modules/organization/organization.routes';
import userRoutes from './modules/user/user.routes';
import taskRoutes from './modules/tasks/task.routes';
import teamRoutes from './modules/teams/team.routes';
import documentRoutes from './modules/documents/document.routes';
import clientRoutes from './modules/crm/clients/client.routes';
import contactRoutes from './modules/crm/contacts/contact.routes';
import leadRoutes from './modules/crm/leads/lead.routes';
import opportunityRoutes from './modules/crm/opportunities/opportunity.routes';
import pipelineRoutes from './modules/crm/pipeline/pipeline.routes';
import activityRoutes from './modules/crm/activities/activity.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import jobsRoutes from './modules/jobs/jobs.routes';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { startWorkers } from './modules/jobs/workers';
import { startScheduler } from './modules/jobs/scheduler';
import projectRoutes from './modules/projects/project.routes';
import systemRoutes from './modules/system/system.routes';

import aiRoutes from './modules/ai/ai.routes';

import searchRoutes from './modules/search/search.routes';
import authRoutes from './modules/auth/auth.routes';
import { env } from './config/env';
import { requestObservability } from './core/middlewares/requestObservability';

const app: Application = express();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
app.use(requestObservability);
// Security and utility middlewares
app.use(helmet());

// Global Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());


// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', message: 'API is healthy' });
});


// Start background workers and scheduler (In production, this might be a separate process)
if (process.env.NODE_ENV !== 'test') {
  startWorkers();
  startScheduler();
}

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'AIWorkspace API',
            version: '1.0.0',
            description: 'API documentation for AIWorkspace CRM and modules',
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
        security: [{ bearerAuth: [] }],
    },
    apis: ['./src/modules/**/*.routes.ts'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// System/Health Routes (No Auth Required)
app.use('/api/v1/system', systemRoutes);

// Apply tenant isolation middleware to all routes after auth

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/crm/clients', clientRoutes);
app.use('/api/v1/crm/contacts', contactRoutes);
app.use('/api/v1/crm/leads', leadRoutes);
app.use('/api/v1/crm/opportunities', opportunityRoutes);
app.use('/api/v1/crm/pipeline-stages', pipelineRoutes);
app.use('/api/v1/crm/activities', activityRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/jobs', jobsRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/search', searchRoutes);

// Global error handler
app.use(errorMiddleware);

export default app;
