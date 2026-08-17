import { pool } from "../../db/pool";
export async function findUserByEmail(email) {
    const result = await pool.query(`
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
export async function createUser({ name, email, passwordHash, }) {
    const result = await pool.query(`
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
