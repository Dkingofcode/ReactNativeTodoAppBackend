import { pool } from "../../db/pool";


export async function createPayment(
  userId: string,
  reference: string,
  amount: number,
  currency: string
) {
  const result = await pool.query(
    `
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
    `,
    [
      userId,
      reference,
      amount,
      currency,
    ]
  );

  return result.rows[0];
}


export async function findPaymentByReference(
  reference: string
) {
  const result = await pool.query(
    `
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
    `,
    [reference]
  );

  return result.rows[0] ?? null;
}

export async function findPaymentByReferenceForUser(
  reference: string,
  userId: string
) {
  const result = await pool.query(
    `
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
    `,
    [reference, userId]
  );

  return result.rows[0] || null;
}


export async function updatePaymentStatus(
  reference: string,
  status: "SUCCESS" | "FAILED" | "CANCELLED"
) {
  const result = await pool.query(
    `
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
    `,
    [
      status,
      reference,
    ]
  );

  return result.rows[0] ?? null;
}