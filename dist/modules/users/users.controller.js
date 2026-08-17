"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
const users_repository_1 = require("./users.repository");
async function getUsers(res) {
    try {
        const users = await (0, users_repository_1.findAllUsers)();
        res.json(users);
    }
    catch (error) {
        console.error("Failed to fetch users:", error);
        res.status(500).json({
            message: "Failed to fetch users",
        });
    }
}
