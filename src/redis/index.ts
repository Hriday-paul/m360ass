import { createClient } from 'redis';
import config from '../config';

const redisUrl = `redis://${config?.redis.password}@${config.redis.host}:${config.redis.port}`

const redisPub = createClient({ url: redisUrl });
const subClient = redisPub.duplicate();

const connectRedis = async () => {
    await Promise.all([redisPub.connect(), subClient.connect()]);
    console.log('✨ Connected to Redis server');
};

const connectionInfo = {
    host: config.redis.host,
    port: Number(config.redis.port),
    password: config.redis.password,
    maxRetriesPerRequest: null, // REQUIRED for BullMQ
    retryStrategy(times: number) {
        return Math.min(times * 50, 2000);
    }
}

// const messageQueue = new Queue('save_messages', {
//   connection: pubClient,
// });

export { redisPub, subClient, connectRedis, connectionInfo };
