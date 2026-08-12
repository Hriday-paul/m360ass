import { Queue } from "bullmq";
import { connectionInfo } from "../redis";

export const makeRentalQueue = new Queue(
    "make-rental",
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

export const updateRentalQueue = new Queue(
    "update-rental",
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