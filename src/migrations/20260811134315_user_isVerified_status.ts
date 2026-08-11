import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("users", (table) => {
        table.boolean("isVerified").defaultTo(false);
    });
}


export async function down(knex: Knex): Promise<void> {
}

