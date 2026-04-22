import Fastify from 'fastify';
import cors from '@fastify/cors';
import httpProxy from '@fastify/http-proxy';
import { Server } from 'socket.io';
import Redis from 'ioredis';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

const BACKEND = process.env.BACKEND_URL || 'http://backend:8000';
const PORT = Number(process.env.PORT || 8080);
const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379/0');

await app.register(httpProxy, {
  upstream: BACKEND,
  prefix: '/api',
  rewritePrefix: '/api'
});

await app.register(httpProxy, {
  upstream: BACKEND,
  prefix: '/ws',
  websocket: true,
  rewritePrefix: '/ws'
});

app.get('/health', async () => ({ ok: true, service: 'gateway' }));

const server = app.server;
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  socket.emit('model_heartbeat', { active: 'polinations', status: 'green', ts: Date.now() });
  socket.on('terminal:stdin', (data) => io.emit('terminal:stdout', data));
});

setInterval(() => {
  io.emit('model_heartbeat', { active: 'polinations', status: 'green', ts: Date.now() });
}, 5000);

await app.listen({ port: PORT, host: '0.0.0.0' });
await redis.ping();
