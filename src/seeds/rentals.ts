import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
    const [vehicle] = await knex("vehicles")
        .insert({
            name: "Toyota Axio",
            plate_number: "DHAKA-11-1234",
            category: "car",
            daily_rate: 1500,
            isDeleted: false,
        })
        .returning(["id", "daily_rate"]);

    await knex("rentals").insert({
        vehicle_id: vehicle.id,
        customer_name: "Rahim Ahmed",
        customer_phone: "+8801712345678",
        start_date: "2026-07-29",
        end_date: "2026-08-03",
        total_amount: 6 * Number(vehicle.daily_rate),
        status: "completed",
    });
};
