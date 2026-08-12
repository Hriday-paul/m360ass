import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {

    await knex.schema.createTable("rentals", (table) => {
        table.increments("id").primary();
        table.integer("vehicle_id").unsigned().notNullable().references("id").inTable("vehicles").onDelete("CASCADE");
        table.integer("customer_id").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
        table.date("start_date").notNullable();
        table.date("end_date").notNullable();
        table.decimal("total_amount", 10, 2).notNullable();
        table.enu("status", ["booked", "ongoing", "completed", "cancelled"]).notNullable().defaultTo("booked");
        table.timestamps(true, true);

        table.check("end_date >= start_date");
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("rentals");
}

