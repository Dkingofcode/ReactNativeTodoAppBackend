"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
exports.env = {
    jwtSecret: process.env.JWT_SECRET || "default_secret",
};
