import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("vehicle_photos", (table) => {
        table.increments("id").primary();
        table.string("base_url").nullable();
        table.string("path").nullable();

        table.integer("vehicle_id").unsigned().notNullable().references("id").inTable("vehicles").onDelete("CASCADE");

        table.timestamps(true, true);
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("vehicle_photos");
}

