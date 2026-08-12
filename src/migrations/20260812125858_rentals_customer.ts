import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("rentals", (table) => {
        table.string("customer_name").notNullable();
        table.string("customer_phone").notNullable();

        table.dropColumn("customer_id");
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable("rentals", (table) => {
        table
            .integer("customer_id")
            .unsigned()
            .references("id")
            .inTable("users")
            .onDelete("RESTRICT");

        table.dropColumn("customer_name");
        table.dropColumn("customer_phone");
    });
}