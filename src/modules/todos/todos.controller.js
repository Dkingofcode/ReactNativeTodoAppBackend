import { findSuccessfulPaymentForUser, findTodoByPaymentId, createTodo, findTodosByUserId, findTodoById, updateTodo, deleteTodo } from "./todos.repository";
// ================================
// POST /todos
// ================================
export async function createTodoController(req, res) {
    try {
        const { title, paymentId } = req.body;
        // 1. Validate request body
        if (!title || !paymentId) {
            return res.status(400).json({
                message: "Title and paymentId are required.",
            });
        }
        // 2. Make sure authentication middleware provided the user
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }
        const userId = req.user.userId;
        // 3. Clean title
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
        // 4. Verify payment
        const payment = await findSuccessfulPaymentForUser(paymentId, userId);
        if (!payment) {
            return res.status(403).json({
                message: "A successful payment belonging to this user is required to create a Todo.",
            });
        }
        // 5. Make sure this payment hasn't already been used
        const existingTodo = await findTodoByPaymentId(paymentId);
        if (existingTodo) {
            return res.status(409).json({
                message: "This payment has already been used to create a Todo.",
            });
        }
        // 6. Create Todo
        const todo = await createTodo(userId, paymentId, cleanTitle);
        // 7. Return result
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
// =================================
// GET /todos
// =================================
export async function getTodosController(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }
        const userId = req.user.userId;
        const todos = await findTodosByUserId(userId);
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
// ==========================================
// GET /todos/:id
// ==========================================
export async function getTodoByIdController(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }
        const { id } = req.params;
        const userId = req.user.userId;
        const todo = await findTodoById(id, userId);
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
// ==========================================
// PATCH /todos/:id
// ==========================================
export async function updateTodoController(req, res) {
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
        // Get current Todo
        const existingTodo = await findTodoById(id, userId);
        if (!existingTodo) {
            return res.status(404).json({
                message: "Todo not found.",
            });
        }
        const updatedTitle = cleanTitle ?? existingTodo.title;
        const updatedStatus = status ?? existingTodo.status;
        const todo = await updateTodo(id, userId, updatedTitle, updatedStatus);
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
// ==========================================
// DELETE /todos/:id
// ==========================================
export async function deleteTodoController(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }
        const { id } = req.params;
        const userId = req.user.userId;
        const todo = await deleteTodo(id, userId);
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
