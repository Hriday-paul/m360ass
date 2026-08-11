import { Queue } from "bullmq";
import { connectionInfo } from "../redis";

export const FileDltQueue = new Queue(
    "dltFiles",
    {
        connection: connectionInfo,
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: "exponential", delay: 2000 },
            removeOnComplete: true,
            removeOnFail: 100
        }
    },
);