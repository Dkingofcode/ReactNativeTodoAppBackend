"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
const bcrypt = __importStar(require("bcrypt"));
const jwt = __importStar(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const auth_repository_1 = require("./auth.repository");
async function register(req, res) {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required.",
            });
        }
        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long.",
            });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await (0, auth_repository_1.findUserByEmail)(normalizedEmail);
        if (existingUser) {
            return res.status(409).json({
                message: "A user with this email already exists.",
            });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await (0, auth_repository_1.createUser)({
            name: name.trim(),
            email: normalizedEmail,
            passwordHash,
        });
        return res.status(201).json({
            message: "User registered successfully.",
            user,
        });
    }
    catch (error) {
        console.error("Registration failed:", error);
        return res.status(500).json({
            message: "Something went wrong while creating the account.",
        });
    }
}
async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required.",
            });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const user = await (0, auth_repository_1.findUserByEmail)(normalizedEmail);
        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password.",
            });
        }
        const passwordMatches = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password.",
            });
        }
        if (!env_1.env.jwtSecret) {
            throw new Error("JWT_SECRET is not configured.");
        }
        const token = jwt.sign({
            userId: user.id,
            email: user.email,
        }, env_1.env.jwtSecret, {
            expiresIn: "7d",
        });
        return res.status(200).json({
            message: "Login successful.",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });
    }
    catch (error) {
        console.error("Login failed:", error);
        return res.status(500).json({
            message: "Something went wrong while logging in.",
        });
    }
}
