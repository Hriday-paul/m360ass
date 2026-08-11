import { Worker } from "bullmq"
import { sendEmail } from "../utils/mailSender";
import { connectionInfo } from "../redis";

new Worker("email", async job => {

    const { to, subject, html } = job.data;

    await sendEmail(
        to,
        subject,
        html
    );

}, { connection: connectionInfo })
    .on("failed", (job, err) => {
        console.log(`------email send failed ❌ to: ${job?.data?.to}------`, err.message);
    });