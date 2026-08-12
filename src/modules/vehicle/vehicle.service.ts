import db from "../../db/knex";
import AppError from "../../error/AppError";
import { paginationHelper, TPaginationOptions } from "../../helper/pagination.helper";
import { Vehicle } from "./vehicle.interface";
import httpStatus from "http-status"

export class VehicleService {

    async addNewVehicle(payload: Vehicle, images: { base_url: string; path: string }[]): Promise<Vehicle> {
        const { deleted_at, isDeleted, updated_at, created_at, ...moreFields } = payload;

        //check if vehicle with same plate number already exists
        const existingVehicle = await db("vehicles").where("plate_number", payload.plate_number).first();
        if (existingVehicle) {
            throw new Error("Vehicle with same plate number already exists");
        }

        //save to database
        const vehicle = await db.transaction(async (trx) => {

            const [vehicle] = await trx("vehicles").insert(moreFields).returning(["id", "name", "plate_number", "category", "daily_rate", "created_at", "updated_at"]);

            if (images.length > 0) {
                await trx("vehicle_photos").insert(images.map((image) => ({ ...image, vehicle_id: vehicle.id })));
            }

            return vehicle;
        })

        return vehicle;
    }

    async getAllVehicles(query: Record<string, unknown>, options: TPaginationOptions) {

        const { search, category } = query;
        const { limit, skip, sortBy, sortOrder, page } = paginationHelper.calculatePagination(options);

        const db_query = db("vehicles as v")
            .leftJoin("vehicle_photos as vp", "v.id", "vp.vehicle_id")
            .select(
                "v.id",
                "v.name",
                "v.plate_number",
                "v.category",
                "v.daily_rate",
                "v.created_at",
                "v.updated_at",
            )
            .select(
                db.raw(`
      COALESCE(
        json_agg(
          json_build_object(
            'id', vp.id,
            'baseUrl', vp.base_url,
            'path', vp.path
          )
        ) FILTER (WHERE vp.id IS NOT NULL),
        '[]'
      ) AS photos
    `)
            )
            .where("v.isDeleted", false)

        const db_total_query = db("vehicles")
            .where("isDeleted", false)


        //apply filters based on search and category
        if (category) {
            db_query.where("v.category", category);
            db_total_query.where("category", category);
        }
        if (search) {
            db_query
                .whereILike("v.name", `%${search}%`)
                .orWhereILike("v.plate_number", `%${search}%`);
                
            db_total_query
                .whereILike("v.name", `%${search}%`)
                .orWhereILike("v.plate_number", `%${search}%`);
        }

        const vehicles = await db_query
            .groupBy("v.id")
            .orderBy(`v.${sortBy || "created_at"}`, sortOrder || "desc")
            .limit(limit)
            .offset(skip);

        //get total count for pagination
        const total = await db_total_query.count("id as count").first();

        const meta = paginationHelper.generatePaginationMeta({ page, limit, total: Number(total?.count ?? 0) });

        return { meta, vehicles };
    }

    async getVehicleById(vehicleId: string) {
        const vehicle = await db("vehicles as v")
            .leftJoin("vehicle_photos as vp", "v.id", "vp.vehicle_id")
            .select(
                "v.id",
                "v.name",
                "v.plate_number",
                "v.category",
                "v.daily_rate",
                "v.created_at",
                "v.updated_at",
            )
            .select(
                db.raw(`
      COALESCE(
        json_agg(
          json_build_object(
            'id', vp.id,
            'baseUrl', vp.base_url,
            'path', vp.path
          )
        ) FILTER (WHERE vp.id IS NOT NULL),
        '[]'
      ) AS photos
    `)
            )
            .where("v.id", vehicleId)
            .where("v.isDeleted", false)
            .groupBy("v.id")
            .first();
        return vehicle;
    }

    async deleteVehicleById(vehicleId: string) {
        const vehicle = await db("vehicles").where("id", vehicleId).first();
        if (!vehicle) {
            throw new AppError(httpStatus.NOT_FOUND, "Vehicle does not exist");
        }
        //soft delete the vehicle
        await db("vehicles").where("id", vehicleId).update({ isDeleted: true });
    }

    async updateVehicleById(vehicleId: string, payload: Partial<Vehicle>, new_images: { base_url: string; path: string }[]) {

        const vehicle = await db("vehicles").where("id", vehicleId).first();

        if (!vehicle) {
            throw new AppError(httpStatus.NOT_FOUND, "Vehicle does not exist");
        }

        const { name, category, daily_rate } = payload;

        const updateFields: Partial<Vehicle> = { name, category, daily_rate };

        // Remove undefined or null fields to prevent overwriting existing values with null
        Object.keys(updateFields).forEach((key) => {
            if (updateFields[key as keyof Vehicle] === undefined || updateFields[key as keyof Vehicle] === null) {
                delete updateFields[key as keyof Vehicle];
            }
        });

        // check updated field found or not
        if (Object.keys(updateFields).length === 0) {
            throw new AppError(
                httpStatus.NOT_FOUND,
                'No valid field found',
            );
        }

        const result = await db.transaction(async (trx) => {
            //update vehicle details
            await trx("vehicles").where("id", vehicleId).update(updateFields);

            //add new images if provided
            if (new_images.length > 0) {
                await trx("vehicle_photos").insert(new_images.map((image) => ({ ...image, vehicle_id: vehicleId })));
            }

        })

        return result;

    }

    async deleteVehiclePhotoById({ photoId, vehicleId }: { photoId: string; vehicleId: string }) {
        const photo = await db("vehicle_photos").where("id", photoId).where("vehicle_id", vehicleId).first();

        if (!photo) {
            throw new AppError(httpStatus.NOT_FOUND, "Vehicle photo does not exist");
        }

        //delete the photo
        await db("vehicle_photos").where("id", photoId).del();
    }

}