import { Queue } from "bullmq";
import Redis from "ioredis";

const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379");

export const redisConnection = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
});

export const productQueue = new Queue("product-sync", {
  connection: redisConnection,
});