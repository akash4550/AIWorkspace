import app from './app';
import { logger } from './core/utils/logger';
import { initializeSocket } from './modules/realtime/socket';
import { RealtimeService } from './modules/realtime/realtime.service';

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    
    // Initialize Socket.io
    initializeSocket(server);
    logger.info('Socket.io initialized');

    // Attach EventBus listeners
    const realtimeService = new RealtimeService();
    realtimeService.initializeListeners();
});

// Handle unhandled promise rejections gracefully
process.on('unhandledRejection', (err: Error) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => {
        process.exit(1);
    });
});
