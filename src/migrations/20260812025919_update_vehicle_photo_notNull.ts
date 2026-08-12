import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("vehicle_photos", (table) => {
        table.string("base_url").notNullable().alter();
        table.string("path").notNullable().alter();
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable("vehicle_photos", (table) => {
        table.string("base_url").nullable().alter();
        table.string("path").nullable().alter();
    });
}

