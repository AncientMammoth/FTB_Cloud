const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./db");

const app = express();
const PORT = 4003;

app.use(cors());
app.use(bodyParser.json());

const sendError = (res, message, err) => {
  console.error(message, err);
  res.status(500).json({ error: message });
};

// =================================================================
// USER ENDPOINTS
// =================================================================

app.get("/api/users/by-secret-key/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const { rows } = await db.query(
      `SELECT
        u.id, u.airtable_id, u.user_name,
        COALESCE(json_agg(DISTINCT a.airtable_id) FILTER (WHERE a.id IS NOT NULL), '[]') AS accounts,
        COALESCE(json_agg(DISTINCT p.airtable_id) FILTER (WHERE p.id IS NOT NULL), '[]') AS projects,
        COALESCE(json_agg(DISTINCT t_assigned.airtable_id) FILTER (WHERE t_assigned.id IS NOT NULL), '[]') AS tasks_assigned_to,
        COALESCE(json_agg(DISTINCT t_created.airtable_id) FILTER (WHERE t_created.id IS NOT NULL), '[]') AS tasks_created_by,
        COALESCE(json_agg(DISTINCT upd.airtable_id) FILTER (WHERE upd.id IS NOT NULL), '[]') AS updates
      FROM users u
      LEFT JOIN accounts a ON a.account_owner_id = u.id
      LEFT JOIN projects p ON p.project_owner_id = u.id
      LEFT JOIN tasks t_assigned ON t_assigned.assigned_to_id = u.id
      LEFT JOIN tasks t_created ON t_created.created_by_id = u.id
      LEFT JOIN updates upd ON upd.update_owner_id = u.id
      WHERE u.airtable_id = $1
      GROUP BY u.id, u.airtable_id, u.user_name`,
      [key]
    );
    if (rows.length === 0) return res.status(404).json({ error: "User not found." });
    res.json(rows[0]);
  } catch (err) {
    sendError(res, "Failed to fetch user.", err);
  }
});

app.get("/api/users", async (req, res) => {
    try {
        const { rows } = await db.query("SELECT id, airtable_id, user_name FROM users ORDER BY user_name;");
        res.json(rows);
    } catch (err) {
        sendError(res, "Failed to fetch all users.", err);
    }
});

app.patch("/api/users/:id", async (req, res) => {
    res.status(200).json({ message: "User update acknowledged." });
});


// =================================================================
// FETCH BY IDs ENDPOINTS
// =================================================================

app.get("/api/accounts", async (req, res) => {
    try {
        const { ids } = req.query;
        if (!ids) return res.status(400).json({ error: "No IDs provided." });
        const idArray = ids.split(',');
        
        // This query now joins with projects and aggregates their IDs
        const { rows } = await db.query(
            `SELECT 
               a.*,
               COALESCE(json_agg(p.airtable_id) FILTER (WHERE p.id IS NOT NULL), '[]') as projects
             FROM accounts a
             LEFT JOIN projects p ON p.account_id = a.id
             WHERE a.airtable_id = ANY($1::varchar[])
             GROUP BY a.id`, 
            [idArray]
        );
        
        res.json(rows);
    } catch (err) {
        sendError(res, 'Failed to fetch accounts', err);
    }
});

app.get("/api/projects", async (req, res) => {
    try {
        const { ids } = req.query;
        if (!ids) return res.status(400).json({ error: "No IDs provided." });
        const idArray = ids.split(',');
        const { rows } = await db.query(
            `SELECT p.*, a.account_name
             FROM projects p
             LEFT JOIN accounts a ON p.account_id = a.id
             WHERE p.airtable_id = ANY($1::varchar[])`,
            [idArray]
        );
        res.json(rows);
    } catch (err) {
        sendError(res, 'Failed to fetch projects', err);
    }
});

app.get("/api/tasks", async (req, res) => {
    try {
        const { ids } = req.query;
        if (!ids) return res.status(400).json({ error: "No IDs provided." });
        const idArray = ids.split(',');
        const { rows } = await db.query(
            `SELECT t.*, p.project_name, u.user_name as assigned_to_name
             FROM tasks t
             LEFT JOIN projects p ON t.project_id = p.id
             LEFT JOIN users u ON t.assigned_to_id = u.id
             WHERE t.airtable_id = ANY($1::varchar[])`,
            [idArray]
        );
        res.json(rows);
    } catch (err) {
        sendError(res, 'Failed to fetch tasks', err);
    }
});

app.get("/api/updates", async (req, res) => {
    try {
        const { ids } = req.query;
        let query = `
            SELECT u.*, owner.user_name as update_owner_name
            FROM updates u
            LEFT JOIN users owner ON u.update_owner_id = owner.id
        `;
        const queryParams = [];
        if (ids) {
            query += ` WHERE u.airtable_id = ANY($1::varchar[])`;
            queryParams.push(ids.split(','));
        }
        const { rows } = await db.query(query, queryParams);
        res.json(rows);
    } catch (err) {
        sendError(res, 'Failed to fetch updates', err);
    }
});


// =================================================================
// CREATE/UPDATE ENDPOINTS
// =================================================================

app.post("/api/accounts", async (req, res) => {
    const {
        "Account Name": account_name, "Account Type": account_type,
        "Account Description": account_description, "Account Owner": owner_airtable_id_arr
    } = req.body;
    try {
        const ownerRes = await db.query("SELECT id FROM users WHERE airtable_id = $1", [owner_airtable_id_arr[0]]);
        const owner_id = ownerRes.rows[0]?.id;
        if (!owner_id) return res.status(400).json({ error: "Invalid account owner ID" });
        const { rows } = await db.query(
            `INSERT INTO accounts (account_name, account_type, account_description, account_owner_id, airtable_id) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [account_name, account_type, account_description, owner_id, `rec_${Math.random().toString(16).slice(2)}`]
        );
        res.status(201).json(rows[0]);
    } catch (err) { sendError(res, 'Failed to create account.', err); }
});

app.post("/api/projects", async (req, res) => {
    const {
        "Project Name": name, "Project Status": status, "Start Date": start_date, "End Date": end_date,
        "Account": account_airtable_id_arr, "Project Value": value, "Project Description": description, "Project Owner": owner_airtable_id_arr
    } = req.body;
    try {
        const accountRes = await db.query("SELECT id FROM accounts WHERE airtable_id = $1", [account_airtable_id_arr[0]]);
        const ownerRes = await db.query("SELECT id FROM users WHERE airtable_id = $1", [owner_airtable_id_arr[0]]);
        const account_id = accountRes.rows[0]?.id;
        const owner_id = ownerRes.rows[0]?.id;
        if (!account_id || !owner_id) return res.status(400).json({ error: "Invalid account or owner ID" });
        const { rows } = await db.query(
            `INSERT INTO projects (project_name, project_status, start_date, end_date, account_id, project_value, project_description, project_owner_id, airtable_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [name, status, start_date, end_date, account_id, value || null, description, owner_id, `rec_${Math.random().toString(16).slice(2)}`]
        );
        res.status(201).json(rows[0]);
    } catch (err) { sendError(res, 'Failed to create project.', err); }
});

app.post("/api/tasks", async (req, res) => {
    // Correctly destructure the incoming string values
    const {
        "Task Name": name, "Project": project_airtable_id, "Assigned To": assigned_to_airtable_id,
        "Due Date": due_date, "Status": status, "Description": description, "Created By": created_by_airtable_id
    } = req.body;

    try {
        // Remove the [0] array access to use the string IDs directly
        const projectRes = await db.query("SELECT id FROM projects WHERE airtable_id = $1", [project_airtable_id]);
        const assignedToRes = await db.query("SELECT id FROM users WHERE airtable_id = $1", [assigned_to_airtable_id]);
        const createdByRes = await db.query("SELECT id FROM users WHERE airtable_id = $1", [created_by_airtable_id]);
        
        const project_id = projectRes.rows[0]?.id;
        const assigned_to_id = assignedToRes.rows[0]?.id;
        const created_by_id = createdByRes.rows[0]?.id;

        if (!project_id || !assigned_to_id || !created_by_id) {
            return res.status(400).json({ error: "Invalid project, assigned to, or created by ID" });
        }
        
        const { rows } = await db.query(
            `INSERT INTO tasks (task_name, project_id, assigned_to_id, due_date, status, description, created_by_id, airtable_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [name, project_id, assigned_to_id, due_date, status, description, created_by_id, `rec_${Math.random().toString(16).slice(2)}`]
        );
        res.status(201).json(rows[0]);
    } catch (err) { 
        sendError(res, 'Failed to create task.', err); 
    }
});

// *** THIS IS THE NEWLY ADDED CODE BLOCK ***
app.post("/api/updates", async (req, res) => {
    const {
        "Notes": notes, "Date": date, "Update Type": update_type,
        "Project": project_airtable_id_arr, "Task": task_airtable_id_arr, "Update Owner": owner_airtable_id_arr
    } = req.body;

    try {
        const projectRes = await db.query("SELECT id FROM projects WHERE airtable_id = $1", [project_airtable_id_arr[0]]);
        const ownerRes = await db.query("SELECT id FROM users WHERE airtable_id = $1", [owner_airtable_id_arr[0]]);
        const project_id = projectRes.rows[0]?.id;
        const owner_id = ownerRes.rows[0]?.id;

        if (!project_id || !owner_id) return res.status(400).json({ error: "Invalid project or owner ID" });
        
        let task_id = null;
        if (task_airtable_id_arr && task_airtable_id_arr.length > 0) {
            const taskRes = await db.query("SELECT id FROM tasks WHERE airtable_id = $1", [task_airtable_id_arr[0]]);
            task_id = taskRes.rows[0]?.id;
        }

        const { rows } = await db.query(
            `INSERT INTO updates (notes, date, update_type, project_id, task_id, update_owner_id, airtable_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [notes, date, update_type, project_id, task_id, owner_id, `rec_${Math.random().toString(16).slice(2)}`]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        sendError(res, 'Failed to create update.', err);
    }
});


app.patch("/api/tasks/:airtable_id", async (req, res) => {
    try {
        const { airtable_id } = req.params;
        const fields = req.body;
        const fieldToUpdate = Object.keys(fields)[0];
        const value = fields[fieldToUpdate];
        const dbColumn = fieldToUpdate.toLowerCase();
        const { rows } = await db.query(
            `UPDATE tasks SET ${dbColumn} = $1 WHERE airtable_id = $2 RETURNING *`,
            [value, airtable_id]
        );
        res.json(rows[0]);
    } catch (err) { sendError(res, "Failed to update task.", err); }
});

module.exports = app;