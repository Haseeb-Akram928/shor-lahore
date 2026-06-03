import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './config/socket.js';
import { env } from './config/env.js';

const httpServer = http.createServer(app);

// Initialize Socket.io
initSocket(httpServer);

// Connect to MongoDB and start server
const start = async () => {
  await connectDB();

  httpServer.listen(env.PORT, () => {
    console.log(`
    ╔══════════════════════════════════════╗
    ║   🔊  ShorLahore API Server          ║
    ║   Port: ${env.PORT}                        ║
    ║   Mode: ${env.NODE_ENV.padEnd(24)}║
    ║   MongoDB: Connected ✅             ║
    ║   Socket.io: Attached ✅            ║
    ╚══════════════════════════════════════╝
    `);
  });
};

start().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
