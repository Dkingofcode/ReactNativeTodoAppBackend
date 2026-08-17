import { pool } from "../../db/pool";
export async function findAllUsers() {
    const result = await pool.query(`
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
