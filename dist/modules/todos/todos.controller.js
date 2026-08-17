"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTodoController = createTodoController;
exports.getTodosController = getTodosController;
exports.getTodoByIdController = getTodoByIdController;
exports.updateTodoController = updateTodoController;
exports.deleteTodoController = deleteTodoController;
const todos_repository_1 = require("./todos.repository");
async function createTodoController(req, res) {
    try {
        const { title, paymentId } = req.body;
        if (!title || !paymentId) {
            return res.status(400).json({
                message: "Title and paymentId are required.",
            });
        }
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }
        const userId = req.user.userId;
        const cleanTitle = title.trim();
        if (cleanTitle.length === 0) {
            return res.status(400).json({
                message: "Todo title cannot be empty.",
            });
        }
        if (cleanTitle.length > 255) {
            return res.status(400).json({
                message: "Todo title cannot exceed 255 characters.",
            });
        }
        const payment = await (0, todos_repository_1.findSuccessfulPaymentForUser)(paymentId, userId);
        if (!payment) {
            return res.status(403).json({
                message: "A successful payment belonging to this user is required to create a Todo.",
            });
        }
        const existingTodo = await (0, todos_repository_1.findTodoByPaymentId)(paymentId);
        if (existingTodo) {
            return res.status(409).json({
                message: "This payment has already been used to create a Todo.",
            });
        }
        const todo = await (0, todos_repository_1.createTodo)(userId, paymentId, cleanTitle);
        return res.status(201).json({
            message: "Todo created successfully.",
            todo,
        });
    }
    catch (error) {
        console.error("Todo creation failed:", error);
        return res.status(500).json({
            message: "Something went wrong while creating the Todo.",
        });
    }
}
async function getTodosController(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }
        const userId = req.user.userId;
        const todos = await (0, todos_repository_1.findTodosByUserId)(userId);
        return res.status(200).json({
            todos,
        });
    }
    catch (error) {
        console.error("Fetching todos failed:", error);
        return res.status(500).json({
            message: "Something went wrong while fetching todos.",
        });
    }
}
async function getTodoByIdController(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }
        const { id } = req.params;
        const userId = req.user.userId;
        const todo = await (0, todos_repository_1.findTodoById)(id, userId);
        if (!todo) {
            return res.status(404).json({
                message: "Todo not found.",
            });
        }
        return res.status(200).json({
            todo,
        });
    }
    catch (error) {
        console.error("Fetching Todo failed:", error);
        return res.status(500).json({
            message: "Something went wrong while fetching the Todo.",
        });
    }
}
async function updateTodoController(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }
        const { id } = req.params;
        const { title, status } = req.body;
        const userId = req.user.userId;
        if (title === undefined && status === undefined) {
            return res.status(400).json({
                message: "At least one of title or status is required.",
            });
        }
        let cleanTitle;
        if (title !== undefined) {
            if (typeof title !== "string") {
                return res.status(400).json({
                    message: "Title must be a string.",
                });
            }
            cleanTitle = title.trim();
            if (cleanTitle.length === 0) {
                return res.status(400).json({
                    message: "Todo title cannot be empty.",
                });
            }
            if (cleanTitle.length > 255) {
                return res.status(400).json({
                    message: "Todo title cannot exceed 255 characters.",
                });
            }
        }
        if (status !== undefined &&
            status !== "ACTIVE" &&
            status !== "COMPLETED") {
            return res.status(400).json({
                message: "Status must be ACTIVE or COMPLETED.",
            });
        }
        const existingTodo = await (0, todos_repository_1.findTodoById)(id, userId);
        if (!existingTodo) {
            return res.status(404).json({
                message: "Todo not found.",
            });
        }
        const updatedTitle = cleanTitle ?? existingTodo.title;
        const updatedStatus = status ?? existingTodo.status;
        const todo = await (0, todos_repository_1.updateTodo)(id, userId, updatedTitle, updatedStatus);
        return res.status(200).json({
            message: "Todo updated successfully.",
            todo,
        });
    }
    catch (error) {
        console.error("Todo update failed:", error);
        return res.status(500).json({
            message: "Something went wrong while updating the Todo.",
        });
    }
}
async function deleteTodoController(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }
        const { id } = req.params;
        const userId = req.user.userId;
        const todo = await (0, todos_repository_1.deleteTodo)(id, userId);
        if (!todo) {
            return res.status(404).json({
                message: "Todo not found.",
            });
        }
        return res.status(200).json({
            message: "Todo deleted successfully.",
            todo,
        });
    }
    catch (error) {
        console.error("Todo deletion failed:", error);
        return res.status(500).json({
            message: "Something went wrong while deleting the Todo.",
        });
    }
}
