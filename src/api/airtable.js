const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
const AIRTABLE_PAT = import.meta.env.VITE_AIRTABLE_PAT;
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

// Generic API request helper
async function apiRequest(path, params = "", options = {}) {
  const url = `${AIRTABLE_API_URL}/${path}${params}`;
  console.log(`[Airtable] Request: ${options.method || "GET"} ${url}`);

  try {
    const res = await fetch(url, {
      method: options.method || "GET",
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json",
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Airtable] Error: ${res.status} ${res.statusText}`, errorText);
      throw new Error(`Airtable error: ${res.status} ${res.statusText} - ${errorText}`);
    }

    const data = await res.json();
    console.log(`[Airtable] Success:`, data);
    return data;
  } catch (err) {
    console.error(`[Airtable] Network/Parsing Error:`, err);
    throw err;
  }
}

// === USER AUTH & FETCHING ===

export async function fetchUserBySecretKey(secretKey) {
  try {
    const formula = encodeURIComponent(`{secret_key} = "${secretKey}"`);
    const data = await apiRequest("Users", `?filterByFormula=${formula}`);
    if (data.records.length === 0) {
      console.warn(`[fetchUserBySecretKey] No user found for key: ${secretKey}`);
      return null;
    }
    return data.records[0];
  } catch (err) {
    console.error("[fetchUserBySecretKey] Failed:", err);
    throw err;
  }
}

export async function fetchUserById(id) {
  if (!id) return null;
  return await apiRequest(`Users/${id}`);
}

export async function fetchAllUsers() {
    try {
        const data = await apiRequest("Users");
        return data.records.sort((a, b) => {
            const nameA = a.fields["User Name"] || "";
            const nameB = b.fields["User Name"] || "";
            return nameA.localeCompare(nameB);
        });
    } catch (err) {
        console.error("[fetchAllUsers] Failed:", err);
        throw err;
    }
}


// === DIRECT RECORD FETCHING BY ID ===

export async function fetchAccountById(id) {
  return await apiRequest(`Accounts/${id}`);
}

export async function fetchProjectById(id) {
  return await apiRequest(`Projects/${id}`);
}

export async function fetchUpdateById(id) {
  return await apiRequest(`Updates/${id}`);
}

// === BULK FETCHING BY ARRAY OF IDs ===

export async function fetchAccountsByIds(ids = []) {
  if (!ids || ids.length === 0) return [];
  return await Promise.all(ids.map(fetchAccountById));
}

export async function fetchProjectsByIds(ids = []) {
  if (!ids || ids.length === 0) return [];
  const fetchProjectByIdHelper = (id) => apiRequest(`Projects/${id}`);
  return await Promise.all(ids.map(fetchProjectByIdHelper));
}

export async function fetchUpdatesByIds(ids = []) {
  if (!ids || ids.length === 0) return [];
  const fetchUpdateByIdHelper = (id) => apiRequest(`Updates/${id}`);
  return await Promise.all(ids.map(fetchUpdateByIdHelper));
}

// --- ACCOUNT/PROJECT/UPDATE CREATION ---
export async function createAccount(fields) {
  return await createRecord("Accounts", fields);
}

export async function updateUser(userId, fields) {
  return await updateRecord("Users", userId, fields);
}

export async function createProject(fields) {
  return await createRecord("Projects", fields);
}

export async function createUpdate(fields) {
  return await createRecord("Updates", fields);
}

// === TASK MANAGEMENT FUNCTIONS ===

export async function createTask(fields) {
    return await createRecord("Tasks", fields);
}

const fetchTaskById = (id) => apiRequest(`Tasks/${id}`);

export async function fetchTasksByIds(ids = []) {
  if (!ids || ids.length === 0) return [];
  return await Promise.all(ids.map(fetchTaskById));
}

export async function updateTask(taskId, fields) {
    return await updateRecord("Tasks", taskId, fields);
}


// === GENERIC CUD HELPERS ===

export async function createRecord(table, fields) {
  try {
    const data = await apiRequest(table, "", {
      method: "POST",
      body: { fields },
    });
    return data;
  } catch (err) {
    console.error(`[createRecord in ${table}] Failed:`, err);
    throw err;
  }
}

export async function updateRecord(table, id, fields) {
  try {
    const data = await apiRequest(`${table}/${id}`, "", {
      method: "PATCH",
      body: { fields },
    });
    return data;
  } catch (err)
    {
    console.error(`[updateRecord in ${table}] Failed:`, err);
    throw err;
  }
}

export async function deleteRecord(table, id) {
  try {
    const data = await apiRequest(`${table}/${id}`, "", {
      method: "DELETE",
    });
    return data;
  } catch (err) {
    console.error("[deleteRecord] Failed:", err);
    throw err;
  }
}


// Function to normalize date format for consistent comparison
export function formatDateForAirtable(dateInput) {
  if (!dateInput) return "";
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Fetch all updates from the Updates table without any filtering
 * This allows client-side filtering by project and date
 */
export async function fetchAllUpdates() {
  try {
    console.log("[fetchAllUpdates] Fetching all updates from Airtable");
    
    const data = await apiRequest("Updates");
    
    console.log(`[fetchAllUpdates] Found ${data.records.length} total updates`);
    return data.records;
  } catch (err) {
    console.error("[fetchAllUpdates] Failed:", err);
    return [];
  }
}

/**
 * Process updates for projects (client-side filtering)
 * Returns a map of project IDs to arrays of their updates
 */
export function processUpdatesByProject(allUpdates, projectIds = []) {
  if (!projectIds || projectIds.length === 0) {
    console.log("[processUpdatesByProject] No project IDs provided");
    return {};
  }
  
  console.log(`[processUpdatesByProject] Processing updates for ${projectIds.length} projects`);
  
  // Create a result object to store updates by project ID
  const updatesByProjectId = {};
  
  // Initialize each project with an empty array
  projectIds.forEach(pid => {
    updatesByProjectId[pid] = [];
  });
  
  // Process all updates and organize them by project
  allUpdates.forEach(update => {
    const updateProjects = update.fields.Project || [];
    
    updateProjects.forEach(projectId => {
      if (projectIds.includes(projectId)) {
        updatesByProjectId[projectId].push(update);
      }
    });
  });
  
  return updatesByProjectId;
}

// === FETCH UPDATES FOR A PROJECT AND DATE ===
// Keeping for backwards compatibility, now it uses the simplified approach
export async function fetchProjectUpdates(projectId, selectedDate = null) {
  try {
    // Get all updates from Airtable
    const allUpdates = await fetchAllUpdates();
    
    // Filter updates for the specified project
    const projectUpdates = allUpdates.filter(update => {
      const updateProjects = update.fields.Project || [];
      return updateProjects.includes(projectId);
    });
    
    // If no date provided, return all updates for the project
    if (!selectedDate) {
      return projectUpdates;
    }
    
    // Otherwise, filter the updates by date
    const formattedDate = formatDateForAirtable(selectedDate);
    const filteredUpdates = projectUpdates.filter(update => 
      update.fields.Date === formattedDate
    );
    
    console.log(`[fetchProjectUpdates] Filtered to ${filteredUpdates.length} updates for project ${projectId} on date ${formattedDate}`);
    
    return filteredUpdates;
  } catch (err) {
    console.error("[fetchProjectUpdates] Failed:", err);
    throw err;
  }
}