"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByEmail = findUserByEmail;
exports.createUser = createUser;
const pool_1 = require("../../db/pool");
async function findUserByEmail(email) {
    const result = await pool_1.pool.query(`
      SELECT
        id,
        email,
        name,
        password_hash,
        created_at,
        updated_at
      FROM users
      WHERE email = $1
      LIMIT 1
    `, [email]);
    return result.rows[0] ?? null;
}
async function createUser({ name, email, passwordHash, }) {
    const result = await pool_1.pool.query(`
      INSERT INTO users (
        name,
        email,
        password_hash
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        name,
        email,
        created_at,
        updated_at
    `, [name, email, passwordHash]);
    return result.rows[0];
}
