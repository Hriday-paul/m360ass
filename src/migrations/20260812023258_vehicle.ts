import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {

    await knex.schema.createTable("vehicles", (table) => {
        table.increments("id").primary();
        table.string("name").notNullable();
        table.string("plate_number").notNullable().unique();
        table.enum("category", ["car", "truck", "bus", "motorcycle"]).notNullable();
        table.decimal("daily_rate", 10, 2).notNullable();
        table.boolean("isDeleted").defaultTo(false);
        table.timestamp("deleted_at").nullable();
        table.timestamps(true, true);
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("vehicles");
}

