"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPayment = createPayment;
exports.findPaymentByReference = findPaymentByReference;
exports.findPaymentByReferenceForUser = findPaymentByReferenceForUser;
exports.updatePaymentStatus = updatePaymentStatus;
const pool_1 = require("../../db/pool");
async function createPayment(userId, reference, amount, currency) {
    const result = await pool_1.pool.query(`
      INSERT INTO payments (
        user_id,
        reference,
        amount,
        currency,
        status
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        'PENDING'
      )
      RETURNING
        id,
        user_id,
        reference,
        amount,
        currency,
        status,
        created_at,
        updated_at
    `, [
        userId,
        reference,
        amount,
        currency,
    ]);
    return result.rows[0];
}
async function findPaymentByReference(reference) {
    const result = await pool_1.pool.query(`
      SELECT
        id,
        user_id,
        reference,
        amount,
        currency,
        status,
        created_at,
        updated_at
      FROM payments
      WHERE reference = $1
      LIMIT 1
    `, [reference]);
    return result.rows[0] ?? null;
}
async function findPaymentByReferenceForUser(reference, userId) {
    const result = await pool_1.pool.query(`
    SELECT
      id,
      user_id,
      reference,
      amount,
      currency,
      status,
      created_at,
      updated_at
    FROM payments
    WHERE reference = $1
      AND user_id = $2
    LIMIT 1
    `, [reference, userId]);
    return result.rows[0] || null;
}
async function updatePaymentStatus(reference, status) {
    const result = await pool_1.pool.query(`
      UPDATE payments
      SET
        status = $1,
        updated_at = NOW()
      WHERE reference = $2
      RETURNING
        id,
        user_id,
        reference,
        amount,
        currency,
        status,
        created_at,
        updated_at
    `, [
        status,
        reference,
    ]);
    return result.rows[0] ?? null;
}
