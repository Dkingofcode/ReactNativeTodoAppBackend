"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAllUsers = findAllUsers;
const pool_1 = require("../../db/pool");
async function findAllUsers() {
    const result = await pool_1.pool.query(`
    SELECT
      id,
      email,
      name,
      created_at,
      updated_at
    FROM users
    ORDER BY created_at DESC
  `);
    return result.rows;
}
