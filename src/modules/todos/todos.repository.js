import { pool } from "../../db/pool";
export async function findSuccessfulPaymentForUser(paymentId, userId) {
    const result = await pool.query(`
      SELECT
        id,
        user_id,
        reference,
        amount,
        currency,
        status
      FROM payments
      WHERE id = $1
        AND user_id = $2
        AND status = 'SUCCESS'
      LIMIT 1
    `, [paymentId, userId]);
    return result.rows[0] ?? null;
}
export async function findTodoByPaymentId(paymentId) {
    const result = await pool.query(`
      SELECT
        id,
        user_id,
        payment_id,
        title,
        status,
        created_at,
        updated_at
      FROM todos
      WHERE payment_id = $1
      LIMIT 1
    `, [paymentId]);
    return result.rows[0] ?? null;
}
export async function createTodo(userId, paymentId, title) {
    const result = await pool.query(`
      INSERT INTO todos (
        user_id,
        payment_id,
        title,
        status
      )
      VALUES ($1, $2, $3, 'ACTIVE')
      RETURNING
        id,
        user_id,
        payment_id,
        title,
        status,
        created_at,
        updated_at
    `, [userId, paymentId, title]);
    return result.rows[0];
}
export async function findTodosByUserId(userId) {
    const result = await pool.query(`
      SELECT
        id,
        user_id,
        payment_id,
        title,
        status,
        created_at,
        updated_at
      FROM todos
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);
    return result.rows;
}
export async function findTodoById(todoId, userId) {
    const result = await pool.query(`
    SELECT *
    FROM todos
    WHERE id = $1
      AND user_id = $2
    `, [todoId, userId]);
    return result.rows[0] || null;
}
export async function updateTodo(todoId, userId, title, status) {
    const result = await pool.query(`
    UPDATE todos
    SET
      title = $1,
      status = $2,
      updated_at = NOW()
    WHERE id = $3
      AND user_id = $4
    RETURNING *
    `, [title, status, todoId, userId]);
    return result.rows[0] || null;
}
export async function deleteTodo(todoId, userId) {
    const result = await pool.query(`
    DELETE FROM todos
    WHERE id = $1
      AND user_id = $2
    RETURNING *
    `, [todoId, userId]);
    return result.rows[0] || null;
}
