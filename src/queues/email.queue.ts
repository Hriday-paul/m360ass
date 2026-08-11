import { Queue } from "bullmq";
import { connectionInfo } from "../redis";

export const emailQueue = new Queue(
    "email",
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