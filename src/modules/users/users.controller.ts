import { Response } from "express";
import { findAllUsers } from "./users.repository";

export async function getUsers(
  
  res: Response
) {
  try {
    const users = await findAllUsers();

    res.json(users);
  } catch (error) {
    console.error("Failed to fetch users:", error);

    res.status(500).json({
      message: "Failed to fetch users",
    });
  }
}