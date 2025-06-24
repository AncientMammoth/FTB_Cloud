import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask, fetchAllUsers, fetchProjectsByIds, updateUser, fetchUserById } from "../api";
import { useNavigate } from "react-router-dom";

const TASK_STATUS_OPTIONS = ["To Do", "In Progress", "Done", "Blocked"];

export default function CreateTask() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [fields, setFields] = useState({
    "Task Name": "",
    "Project": "",
    "Assigned To": "",
    "Due Date": "",
    "Status": "To Do",
    "Description": "",
  });
  const [error, setError] = useState("");

  const adminUserId = localStorage.getItem("userRecordId") || "";
  
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["allUsers"],
    queryFn: fetchAllUsers,
  });
  
  const projectIds = JSON.parse(localStorage.getItem("projectIds") || "[]");
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects", projectIds],
    queryFn: () => fetchProjectsByIds(projectIds),
    enabled: projectIds.length > 0,
  });

  // --- REFACTORED LOGIC USING useMutation ---
  const createTaskMutation = useMutation({
    // The new mutation is much simpler. It passes all the necessary data to the backend at once.
   mutationFn: (taskData) => createTask({
       ...taskData,
       "Created By": adminUserId, // Add the creator's ID
     }),
    // --- THIS IS THE CRITICAL FIX ---
    onSuccess: () => {
     // Invalidate queries for tasks and projects to refetch fresh data.
     queryClient.invalidateQueries({ queryKey: ['userTasks'] });
     queryClient.invalidateQueries({ queryKey: ['projects'] });
     queryClient.invalidateQueries({ queryKey: ['tasks'] });
      navigate('/tasks');
    },
    onError: (err) => {
      setError(err.message || "Failed to create task. Please try again.");
      console.error("[CreateTask] Mutation Error:", err);
    }
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!fields["Task Name"] || !fields["Project"] || !fields["Assigned To"] || !fields["Due Date"]) {
      setError("Please fill out all required fields.");
      return;
    }
    createTaskMutation.mutate(fields);
  }
  
  const handleFieldChange = (field, value) => {
    setFields(f => ({ ...f, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <form onSubmit={handleSubmit} className="bg-white-500 p-8 rounded-lg shadow-md border border-gray-200 space-y-6">
          <h1 className="text-3xl font-semibold text-gray-800">Create and Assign Task</h1>
        {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                <p className="font-bold">Error</p>
                <p>{error}</p>
            </div>
        )}

        {/* ... form fields remain the same ... */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
          <input
            required
            type="text"
            placeholder="e.g., Draft initial project proposal"
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            value={fields["Task Name"]}
            onChange={e => handleFieldChange("Task Name", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select
                    required
                    value={fields["Assigned To"]}
                    onChange={e => handleFieldChange("Assigned To", e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm"
                    disabled={usersLoading}
                >
                    <option value="" disabled>Select a user...</option>
                    {users.map(user => (
                        <option key={user.id} value={user.id}>{user.fields["User Name"]}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <select
                    required
                    value={fields["Project"]}
                    onChange={e => handleFieldChange("Project", e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm"
                    disabled={projectsLoading}
                >
                    <option value="" disabled>Select a project...</option>
                    {projects.map(project => (
                        <option key={project.id} value={project.id}>{project.fields["Project Name"]}</option>
                    ))}
                </select>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                    required
                    type="date"
                    className="w-full border-gray-300 rounded-md shadow-sm"
                    value={fields["Due Date"]}
                    onChange={e => handleFieldChange("Due Date", e.target.value)}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                    value={fields["Status"]}
                    onChange={e => handleFieldChange("Status", e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm"
                >
                    {TASK_STATUS_OPTIONS.map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            rows="4"
            placeholder="Add a detailed description for the task..."
            className="w-full border-gray-500 rounded-md shadow-sm"
            value={fields["Description"]}
            onChange={e => handleFieldChange("Description", e.target.value)}
          />
        </div>
        
        <div className="flex justify-end">
            <button
                type="submit"
                disabled={createTaskMutation.isLoading || usersLoading || projectsLoading}
                className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-500 hover:bg-gray-700 disabled:bg-gray-400"
            >
                {createTaskMutation.isLoading ? "Creating..." : "Create & Assign Task"}
            </button>
        </div>
      </form>
    </div>
  );
}
