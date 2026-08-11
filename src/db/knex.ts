import knex from "knex";
import knexConfig from "../config/knex.config";

const db = knex(knexConfig.development);

export default db;