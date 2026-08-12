import moment from "moment";
import db from "../../db/knex";
import AppError from "../../error/AppError";
import { Rental } from "./rental.interface";
import httpstatus from "http-status";
import { paginationHelper, TPaginationOptions } from "../../helper/pagination.helper";
import { Vehicle } from "../vehicle/vehicle.interface";

export class RentalService {

    async bookRental(payload: Rental) {
        const { created_at, updated_at, total_amount, ...morePayload } = payload;

        //check vehicle exists
        const vehicle = await db<Vehicle>("vehicles").where({ id: morePayload.vehicle_id, isDeleted: false }).first();

        if (!vehicle) {
            throw new AppError(httpstatus.NOT_FOUND, "Vehicle does not exist");
        }

        //validate a rental is already booked for the same vehicle and overlapping dates
        const overlappingRental = await db("rentals")
            .where("vehicle_id", morePayload.vehicle_id)
            .whereNot("status", "cancelled")
            .where("start_date", "<=", morePayload.end_date)
            .where("end_date", ">=", morePayload.start_date)
            .first();

        if (overlappingRental) {
            throw new AppError(
                httpstatus.CONFLICT,
                "Vehicle is already booked for the selected dates"
            );
        }

        const totalDay = moment(morePayload.end_date).diff(moment(morePayload.start_date), "days") + 1;
        const totalAmount = totalDay * vehicle.daily_rate;

        // Insert rental into the database
        const [rental] = await db("rentals").insert({ ...morePayload, total_amount: totalAmount }).returning("*");
        return rental;
    }

    async rentals(query: Record<string, unknown>, options: TPaginationOptions) {

        const { search, vehicle_id, status, start_date, end_date } = query;
        const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

        const db_query = db("rentals as r")
            .leftJoin("vehicles as v", "r.vehicle_id", "v.id")
            .select(
                "r.id",
                "r.vehicle_id",
                "r.customer_name",
                "r.customer_phone",
                "r.start_date",
                "r.end_date",
                "r.total_amount",
                "r.status",
                "r.created_at",
                "r.updated_at",
                "v.name as vehicle_name",
                "v.plate_number as vehicle_plate_number",
                "v.category as vehicle_category",
                "v.daily_rate as vehicle_daily_rate"
            )

        const db_total_query = db("rentals")

        //apply filters based on search and category
        if (vehicle_id) {
            db_query.where("r.vehicle_id", vehicle_id);
            db_total_query.where("vehicle_id", vehicle_id);
        }
        if (status) {
            db_query.where("r.status", status);
            db_total_query.where("status", status);
        }
        if (start_date) {
            db_query.where("r.start_date", ">=", start_date);
            db_total_query.where("start_date", ">=", start_date);
        }
        if (end_date) {
            db_query.where("r.end_date", "<=", end_date);
            db_total_query.where("end_date", "<=", end_date);
        }
        if (search) {
            db_query
                .whereILike("r.customer_name", `%${search}%`)
                .orWhereILike("r.customer_phone", `%${search}%`);

            db_total_query
                .whereILike("customer_name", `%${search}%`)
                .orWhereILike("customer_phone", `%${search}%`);
        }

        const rentals = await db_query
            .orderBy(`r.${sortBy || "created_at"}`, sortOrder || "desc")
            .limit(limit)
            .offset(skip);

        //get total count for pagination
        const total = await db_total_query.count("id as count").first();

        const meta = paginationHelper.generatePaginationMeta({ page, limit, total: Number(total?.count ?? 0) });

        return { meta, rentals };
    }

    async getRentalById(rentalId: string) {

        const rental = await db("rentals as r")
            .leftJoin("vehicles as v", "r.vehicle_id", "v.id")
            .select(
                "r.id",
                "r.vehicle_id",
                "r.customer_name",
                "r.customer_phone",
                "r.start_date",
                "r.end_date",
                "r.total_amount",
                "r.status",
                "r.created_at",
                "r.updated_at",
                "v.name as vehicle_name",
                "v.plate_number as vehicle_plate_number",
                "v.category as vehicle_category",
                "v.daily_rate as vehicle_daily_rate"
            )
            .where("r.id", rentalId)
            .first();

        return rental;
    }

    async updateRentalById(
        rentalId: string,
        payload: Partial<Rental>
    ) {
        const {
            vehicle_id,
            customer_name,
            customer_phone,
            start_date,
            end_date,
            status,
        } = payload;

        // Check rental exists
        const rental = await db("rentals")
            .where("id", rentalId)
            .first();

        if (!rental) {
            throw new AppError(
                httpstatus.NOT_FOUND,
                "Rental does not exist"
            );
        }

        // New vehicle or existing vehicle
        const targetVehicleId = vehicle_id ?? rental.vehicle_id;

        // New dates or existing dates
        const targetStartDate = start_date ?? rental.start_date;
        const targetEndDate = end_date ?? rental.end_date;

        // Check vehicle exists if vehicle_id is changed
        if (vehicle_id) {
            const vehicle = await db("vehicles")
                .where("id", vehicle_id)
                .where("isDeleted", false)
                .first();

            if (!vehicle) {
                throw new AppError(
                    httpstatus.NOT_FOUND,
                    "Vehicle does not exist"
                );
            }
        }

        // Check overlap if vehicle/date is changed
        if (
            vehicle_id !== undefined ||
            start_date !== undefined ||
            end_date !== undefined
        ) {
            const overlappingRental = await db("rentals")
                .where("vehicle_id", targetVehicleId)
                .whereNot("id", rentalId)
                .whereNotIn("status", ["cancelled"])
                .where("start_date", "<=", targetEndDate)
                .where("end_date", ">=", targetStartDate)
                .first();

            if (overlappingRental) {
                throw new AppError(
                    httpstatus.CONFLICT,
                    "Vehicle is already booked for the selected dates"
                );
            }
        }

        // Build update fields
        const updateFields: Partial<Rental> = {
            vehicle_id,
            customer_name,
            customer_phone,
            start_date,
            end_date,
            status,
        };

        // Recalculate total amount if vehicle/date changes
        if (
            vehicle_id !== undefined ||
            start_date !== undefined ||
            end_date !== undefined
        ) {
            const vehicle = await db<Vehicle>("vehicles")
                .where("id", targetVehicleId)
                .where("isDeleted", false)
                .first();

            if (!vehicle) {
                throw new AppError(
                    httpstatus.NOT_FOUND,
                    "Vehicle does not exist"
                );
            }

            const start = moment(targetStartDate);
            const end = moment(targetEndDate);

            const totalDay = end.diff(start, "days") + 1;

            updateFields.total_amount =
                totalDay * Number(vehicle.daily_rate);
        }

        // Remove undefined/null fields
        Object.keys(updateFields).forEach((key) => {
            const value = updateFields[key as keyof Rental];

            if (value === undefined || value === null) {
                delete updateFields[key as keyof Rental];
            }
        });

        if (Object.keys(updateFields).length === 0) {
            throw new AppError(
                httpstatus.BAD_REQUEST,
                "No valid field found"
            );
        }

        // Update rental in the database
        await db("rentals")
            .where("id", rentalId)
            .update(updateFields);


        return;
    }

    async deleteRentalById(rentalId: string) {

        const rental = await db("rentals")
            .where("id", rentalId)
            .first();

        if (!rental) {
            throw new AppError(
                httpstatus.NOT_FOUND,
                "Rental does not exist"
            );
        }

        // delete the rental
        await db("rentals")
            .where("id", rentalId)
            .del();

        return;
    }


    async reportRentals(query: Record<string, unknown>) {
        const { month, vehicle_id } = query;

        if (!month) {
            throw new AppError(
                httpstatus.BAD_REQUEST,
                "Month is required"
            );
        }

        const monthDate = moment(month as string, "YYYY-MM", true);

        if (!monthDate.isValid()) {
            throw new AppError(
                httpstatus.BAD_REQUEST,
                "Month must be in YYYY-MM format"
            );
        }

        const monthStart = monthDate
            .clone()
            .startOf("month")
            .format("YYYY-MM-DD");

        const monthEnd = monthDate
            .clone()
            .endOf("month")
            .format("YYYY-MM-DD");

        const dbQuery = db("rentals as r")
            .join("vehicles as v", "v.id", "r.vehicle_id")

            // Only active/completed rentals
            .whereIn("r.status", [
                "booked",
                "ongoing",
                "completed",
            ])

            // Rental must overlap requested month
            .where("r.start_date", "<=", monthEnd)
            .where("r.end_date", ">=", monthStart);

        // Optional vehicle filter
        if (vehicle_id) {
            dbQuery.where("r.vehicle_id", vehicle_id);
        }

        const vehicles = await dbQuery
            .select(
                "v.id",
                "v.name",

                // Number of bookings
                db.raw(`
                COUNT(DISTINCT r.id)::integer AS total_bookings
            `),

                // Only count days inside requested month
                db.raw(`
                SUM(
                    LEAST(r.end_date, ?::date)
                    -
                    GREATEST(r.start_date, ?::date)
                    + 1
                )::integer AS days_rented
            `, [monthEnd, monthStart]),

                // Only revenue inside requested month
                db.raw(`
                SUM(
                    (
                        LEAST(r.end_date, ?::date)
                        -
                        GREATEST(r.start_date, ?::date)
                        + 1
                    ) * v.daily_rate
                ) AS revenue
            `, [monthEnd, monthStart])
            )
            .groupBy("v.id", "v.name");

        // Highest revenue vehicle
        const highestRevenueVehicle =
            [...vehicles].sort(
                (a, b) => Number(b.revenue) - Number(a.revenue)
            )[0] ?? null;

        return {
            month,
            vehicles,
            highestRevenueVehicle,
        };
    }
}