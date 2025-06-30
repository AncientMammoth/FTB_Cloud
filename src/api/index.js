

// Generic API request helper for your new backend
async function apiRequest(path, options = {}) {
  const url = `/api/${path}`;
  try {
    const res = await fetch(url, {
      method: options.method || "GET",
      headers: { "Content-Type": "application/json" },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || `Request failed with status ${res.status}`);
    }
    return res.status === 204 ? null : await res.json();
  } catch (err) {
    console.error(`[App API] Error for ${url}:`, err);
    throw err;
  }
}

// =================================================================
// DATA FORMATTING HELPERS
// =================================================================

const formatAccount = (acc) => ({
    id: acc.airtable_id,
    fields: {
        "Account Name": acc.account_name,
        "Account Description": acc.account_description,
        "Account Type": acc.account_type,
        "Projects": acc.projects || [],
    }
});

const formatProject = (proj) => ({
    id: proj.airtable_id,
    fields: {
        "Project Name": proj.project_name,
        "Project Status": proj.project_status,
        "Start Date": proj.start_date,
        "End Date": proj.end_date,
        "Account": proj.account_id ? [proj.account_id] : [],
        "Account Name (from Account)": proj.account_name ? [proj.account_name] : [],
        "Project Value": proj.project_value,
        "Project Description": proj.project_description,
        "Updates": proj.updates || [],
    }
});

const formatTask = (task) => ({
    id: task.airtable_id,
    fields: {
        "Task Name": task.task_name,
        "Description": task.description,
        "Status": task.status,
        "Due Date": task.due_date,
        "Project": task.project_airtable_id ? [task.project_airtable_id] : [],
        "Project Name": task.project_name ? [task.project_name] : [],
        "Assigned To": task.assigned_to_id ? [task.assigned_to_id] : [],
        "Assigned To Name": task.assigned_to_name ? [task.assigned_to_name] : [],
        "Updates": task.updates || [], // This line will now receive the data
    }
});

const formatUpdate = (update) => ({
    id: update.airtable_id,
    fields: {
        "Notes": update.notes,
        "Date": update.date,
        "Update Type": update.update_type,
        // Use the correct airtable_id for linking
        "Project": update.project_airtable_id ? [update.project_airtable_id] : [],
        "Task": update.task_airtable_id ? [update.task_airtable_id] : [],
        "Update Owner Name": update.update_owner_name ? [update.update_owner_name] : [],
        "Project Name": update.project_name,
        "Task Name": update.task_name,
    }
});


// =================================================================
// RE-IMPLEMENTED API FUNCTIONS
// =================================================================

// === USER AUTH ===
export async function fetchUserBySecretKey(secretKey) {
  try {
    const userFromDb = await apiRequest(`users/by-secret-key/${secretKey}`);
    if (!userFromDb) return null;
    
    return {
      id: userFromDb.airtable_id,
      fields: {
        "User Name": userFromDb.user_name,
        "Accounts": userFromDb.accounts,
        "Projects": userFromDb.projects,
        "Tasks (Assigned To)": userFromDb.tasks_assigned_to,
        "Tasks (Created By)": userFromDb.tasks_created_by,
        "Updates": userFromDb.updates,
      }
    };
  } catch (err) {
    if (err.message.includes("404")) return null;
    throw err;
  }
}

export async function fetchUserById(id) {
    const user = await apiRequest(`users/${id}`);
    // You would create a formatUser helper if needed, for now this is fine
    return { id: user.airtable_id, fields: user };
}

export async function fetchAllUsers() {
    const users = await apiRequest("users");
    return users.map(u => ({ id: u.airtable_id, fields: { "User Name": u.user_name } }));
}

// === GENERIC CUD HELPERS ===

export async function createRecord(table, fields) {
  const endpoint = table.toLowerCase();
  const result = await apiRequest(endpoint, { method: 'POST', body: fields });
  return { id: result.airtable_id, fields: result };
}

export async function updateRecord(table, id, fields) {
  const endpoint = `${table.toLowerCase()}/${id}`;
  return await apiRequest(endpoint, { method: 'PATCH', body: fields });
}

// === BULK FETCHING BY ARRAY OF IDs ===

export async function fetchAccountsByIds(ids = []) {
  if (!ids || ids.length === 0) return [];
  const accounts = await apiRequest(`accounts?ids=${ids.join(',')}`);
  return accounts.map(formatAccount);
}

export async function fetchProjectsByIds(ids = []) {
  if (!ids || ids.length === 0) return [];
  const projects = await apiRequest(`projects?ids=${ids.join(',')}`);
  return projects.map(formatProject);
}

export async function fetchTasksByIds(ids = []) {
  if (!ids || ids.length === 0) return [];
  const tasks = await apiRequest(`tasks?ids=${ids.join(',')}`);
  return tasks.map(formatTask);
}

export async function fetchUpdatesByIds(ids = []) {
    if (!ids || ids.length === 0) return [];
    const updates = await apiRequest(`updates?ids=${ids.join(',')}`);
    return updates.map(formatUpdate);
}

export async function fetchUpdatesByProjectId(projectId) {
    if (!projectId) return [];
    const updates = await apiRequest(`updates/by-project/${projectId}`);
    return updates.map(formatUpdate);
}

// === SINGULAR FETCHES (FIX) ===
// Added the missing singular fetch functions
export const fetchAccountById = async (id) => (await fetchAccountsByIds([id]))[0] || null;
export const fetchProjectById = async (id) => (await fetchProjectsByIds([id]))[0] || null;
export const fetchUpdateById = async (id) => (await fetchUpdatesByIds([id]))[0] || null;
export const fetchTaskById = async (id) => (await fetchTasksByIds([id]))[0] || null;

// === CREATION FUNCTIONS (FIX) ===
// Added the missing creation functions
export const createAccount = (fields) => createRecord("Accounts", fields);
export const createProject = (fields) => createRecord("Projects", fields);
export const createTask = (fields) => createRecord("Tasks", fields);
export const createUpdate = (fields) => createRecord("Updates", fields);

// === UPDATE FUNCTIONS ===
export const updateUser = (userId, fields) => updateRecord("Users", userId, fields);
export const updateTask = (taskId, fields) => updateRecord("Tasks", taskId, fields);

// === CLIENT-SIDE LOGIC (Kept for compatibility) ===

export function formatDateForAirtable(dateInput) {
  if (!dateInput) return "";
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function fetchAllUpdates() {
    const updates = await apiRequest("updates");
    return updates.map(formatUpdate);
}

export function processUpdatesByProject(allUpdates, projectIds = []) {
  if (!projectIds || projectIds.length === 0) return {};
  const updatesByProjectId = {};
  projectIds.forEach(pid => { updatesByProjectId[pid] = []; });
  allUpdates.forEach(update => {
    const updateProjectIds = update.fields.Project || [];
    updateProjectIds.forEach(projectId => {
      // Find the project ID in the target list
      const matchingId = projectIds.find(p => p === projectId);
      if (matchingId && updatesByProjectId[matchingId]) {
        updatesByProjectId[matchingId].push(update);
      }
    });
  });
  return updatesByProjectId;
}