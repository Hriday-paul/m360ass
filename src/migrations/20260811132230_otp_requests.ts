import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {

    await knex.schema.createTable("otp_requests", (table) => {
        table.increments("id").primary().unsigned();
        table.string("code").notNullable();

        table.timestamp("expiredAt").notNullable();
        table.boolean("isVerified").defaultTo(false);
        table.enum("type", ["REGISTER", "FORGOT_PASSWORD", "CHANGE_EMAIL"]).defaultTo("REGISTER");
        table.integer("attempts").defaultTo(0);
        table.integer("maxAttempts").defaultTo(5);
        table.integer("userId").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
        table.timestamp("verifiedAt").nullable();

        table.timestamp("createdAt").defaultTo(knex.fn.now());

    });

}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("otp_requests");
}

