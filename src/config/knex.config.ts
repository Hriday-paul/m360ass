import type { Knex } from "knex";
import dotenv from "dotenv";
import config from "./index";

dotenv.config();

const knexConfig: Record<string, Knex.Config> = {
    development: {
        client: "pg",

        connection: {
            host: config.db.host,
            port: Number(config.db.port),
            user: config.db.user,
            password: config.db.password,
            database: config.db.database,
        },

        migrations: {
            directory: "./src/migrations",
        },

        seeds: {
            directory: "./src/seeds",
        },
    },
};

export default knexConfig;