import { Worker } from "bullmq"
import { connectionInfo } from "../redis";
import { deleteManyFromS3 } from "../utils/s3";

new Worker("dltFiles", async job => {

    const { keys } = job.data;

    await deleteManyFromS3(keys);

}, { connection: connectionInfo })
    .on("failed", (job, err) => {
        console.log(`------file delete failed ❌ to: ${job?.data?.keys}------`, err.message);
    });