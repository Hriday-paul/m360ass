import { Job, UnrecoverableError, Worker } from "bullmq"
import { connectionInfo } from "../redis";
import { Rental } from "../modules/rental/rental.interface";
import db from "../db/knex";
import moment from "moment";
import { emailQueue } from "../queues/email.queue";
import { Vehicle } from "../modules/vehicle/vehicle.interface";

interface RentalJobData extends Rental {
    daily_rate: number;
    requested_staff_email: string;
}

new Worker("make-rental", async (job: Job<RentalJobData>) => {

    const { vehicle_id, start_date, end_date, daily_rate } = job.data;

    const { daily_rate: dlr, requested_staff_email, ...payload } = job.data;

    //validate a rental is already booked for the same vehicle and overlapping dates
    const overlappingRental = await db("rentals")
        .where("vehicle_id", vehicle_id)
        .whereNot("status", "cancelled")
        .where("start_date", "<=", end_date)
        .where("end_date", ">=", start_date)
        .first();

    if (overlappingRental) {
        throw new UnrecoverableError("Vehicle is already booked for the selected dates");
    }

    const totalDay = moment(end_date).diff(moment(start_date), "days") + 1;
    const totalAmount = totalDay * daily_rate;

    // Insert rental into the database
    await db("rentals").insert({ ...payload, total_amount: totalAmount }).returning("*");

}, { connection: connectionInfo })
    .on("failed", async (job, err) => {
        if (!job) return;

        const isExhausted = job.attemptsMade >= (job.opts.attempts ?? 1);
        const isUnrecoverable = err instanceof UnrecoverableError;

        if (!isExhausted && !isUnrecoverable) return;

        const { requested_staff_email } = job.data;

        //send email to the staff if the job has failed after all attempts or if it's an unrecoverable error
        await emailQueue.add(
            "email",
            {
                to: requested_staff_email,
                subject: "Rental Booking Failed",
                html: `<p>Dear Staff,</p>
              <p>The rental booking for vehicle ID ${job.data.vehicle_id} has failed after ${job.attemptsMade} attempts.</p>
              <p>Error: ${err.message}</p>
              <p>Please check the system for more details.</p>
              <p>Best regards,<br/>Rental System</p>`
            },
        )

    }).on("completed", async (job) => {
        if (!job) return;

        const { requested_staff_email } = job.data;

        //send email to the staff if the job has completed successfully
        await emailQueue.add(
            "email",
            {
                to: requested_staff_email,
                subject: "Rental Booking Successful",
                html: `<p>Dear Staff,</p>
              <p>The rental booking for vehicle ID ${job.data.vehicle_id} has been completed successfully.</p>
              <p>Please check the system for more details.</p>
              <p>Best regards,<br/>Rental System</p>`
            },
        )

    })


new Worker("update-rental", async (job: Job<{ payload: RentalJobData, targetStartDate: Date, targetEndDate: Date, targetVehicleId: number, rentalId: number, requested_staff_email: string }>) => {

    const { payload, targetStartDate, targetEndDate, targetVehicleId, rentalId } = job.data;


    // Check overlap if vehicle/date is changed
    const overlappingRental = await db("rentals")
        .where("vehicle_id", targetVehicleId)
        .whereNot("id", rentalId)
        .whereNotIn("status", ["cancelled"])
        .where("start_date", "<=", targetEndDate)
        .where("end_date", ">=", targetStartDate)
        .first();

    if (overlappingRental) {
        throw new UnrecoverableError("Vehicle is already booked for the selected dates");
    }

    // Recalculate total amount if vehicle/date changes
    const vehicle = await db<Vehicle>("vehicles")
        .where("id", targetVehicleId)
        .where("isDeleted", false)
        .first();

    if (!vehicle) {
        throw new UnrecoverableError("Vehicle does not exist");
    }

    const start = moment(targetStartDate);
    const end = moment(targetEndDate);

    const totalDay = end.diff(start, "days") + 1;

    payload.total_amount = totalDay * Number(vehicle.daily_rate);


    // Remove undefined/null fields
    Object.keys(payload).forEach((key) => {
        const value = payload[key as keyof Rental];

        if (value === undefined || value === null) {
            delete payload[key as keyof Rental];
        }
    });

    // Update rental in the database
    await db("rentals")
        .where("id", rentalId)
        .update(payload);


}, { connection: connectionInfo })
    .on("failed", async (job, err) => {
        if (!job) return;

        const isExhausted = job.attemptsMade >= (job.opts.attempts ?? 1);
        const isUnrecoverable = err instanceof UnrecoverableError;

        if (!isExhausted && !isUnrecoverable) return;

        const { requested_staff_email, targetVehicleId } = job.data;

        //send email to the staff if the job has failed after all attempts or if it's an unrecoverable error
        await emailQueue.add(
            "email",
            {
                to: requested_staff_email,
                subject: "Rental Booking Failed",
                html: `<p>Dear Staff,</p>
              <p>The rental booking for vehicle ID ${targetVehicleId} has failed after ${job.attemptsMade} attempts.</p>
              <p>Error: ${err.message}</p>
              <p>Please check the system for more details.</p>
              <p>Best regards,<br/>Rental System</p>`
            },
        )

    }).on("completed", async (job) => {
        if (!job) return;

        const { requested_staff_email, targetVehicleId } = job.data;

        //send email to the staff if the job has completed successfully
        await emailQueue.add(
            "email",
            {
                to: requested_staff_email,
                subject: "Rental Booking Updated Successfully",
                html: `<p>Dear Staff,</p>
              <p>The rental booking for vehicle ID ${targetVehicleId} has been updated successfully.</p>
              <p>Please check the system for more details.</p>
              <p>Best regards,<br/>Rental System</p>`
            },
        )

    })