import { Request, Response } from "express";
import * as bcrypt from "bcrypt";
import * as jwt  from "jsonwebtoken";
import { env } from "../../config/env";
import {
  createUser,
  findUserByEmail,
} from "./auth.repository";

export async function register(
  req: Request,
  res: Response
) {
  try {
    const { name, email, password } = req.body;

    // 1. Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    // 2. Basic password validation
    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long.",
      });
    }

    // 3. Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // 4. Check if user already exists
    const existingUser = await findUserByEmail(normalizedEmail);

    if (existingUser) {
      return res.status(409).json({
        message: "A user with this email already exists.",
      });
    }

    // 5. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 6. Create user
    const user = await createUser({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    // 7. Never return password/password_hash
    return res.status(201).json({
      message: "User registered successfully.",
      user,
    });

  } catch (error) {
    console.error("Registration failed:", error);

    return res.status(500).json({
      message: "Something went wrong while creating the account.",
    });
  }
}


export async function login(
  req: Request,
  res: Response
) {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    // 2. Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // 3. Find user
    const user = await findUserByEmail(normalizedEmail);

    // IMPORTANT:
    // Don't tell the client whether the email exists.
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // 4. Compare supplied password with stored bcrypt hash
    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // 5. Make sure JWT secret exists
    if (!env.jwtSecret) {
      throw new Error("JWT_SECRET is not configured.");
    }

    // 6. Create JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      env.jwtSecret,
      {
        expiresIn: "7d",
      }
    );

    // 7. Never return password information
    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Login failed:", error);

    return res.status(500).json({
      message: "Something went wrong while logging in.",
    });
  }
}