import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTaskById, createUpdate } from '../api';
import UpdateForm from './UpdateForm';
import UpdateDisplay from './UpdateDisplay';

export default function TaskDetail() {
  const { taskId } = useParams();
  const queryClient = useQueryClient();

  // State to manage the new update form
  const [notes, setNotes] = useState("");
  const [updateType, setUpdateType] = useState("Call"); // Set a default value

  // This is your query to fetch the task details.
  // The backend now includes all associated updates in this single call.
  const { data: task, isLoading: isTaskLoading, error: taskError } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => fetchTaskById(taskId),
    enabled: !!taskId,
  });

  // This is the mutation hook for creating a new update
  const addUpdateMutation = useMutation({
    mutationFn: createUpdate,
    onSuccess: () => {
      // This is the fix for the "instant update" issue.
      // It invalidates the cached data for this task, forcing a refetch.
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      // Reset the form fields after a successful submission
      setNotes("");
      setUpdateType("Call");
    },
    onError: (err) => {
      console.error("Failed to add update:", err);
      // You can set an error state here to show a message to the user
    },
  });

  // This function handles the form submission
  const handleUpdateSubmit = () => {
    if (!notes.trim()) {
      alert("Please enter some notes for the update.");
      return;
    }

    // Construct the payload for the API
    const updateData = {
      "Notes": notes,
      "Update Type": updateType,
      "Date": new Date().toISOString(),
      // Ensure IDs are passed correctly
      "Task": task.id, // The Airtable-style ID of the current task
      "Project": task.fields.Project[0], // The Project ID from the task's data
      "Update Owner": localStorage.getItem("userRecordId"), // The logged-in user's ID
    };

    addUpdateMutation.mutate(updateData);
  };

  if (isTaskLoading) return <div className="text-center py-20 text-gray-500">Loading task...</div>;
  if (taskError) return <div className="text-center py-20 text-red-500">Error loading task: {taskError.message}</div>;
  if (!task) return <div>Task not found.</div>;

  const taskFields = task.fields;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Task Details Header */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{taskFields["Task Name"]}</h1>
        <p className="text-gray-600 mb-4">{taskFields.Description || "No description provided."}</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-semibold text-gray-500 block">Status</span>
            <span className="text-gray-800">{taskFields.Status}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-500 block">Due Date</span>
            <span className="text-gray-800">{taskFields["Due Date"]}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-500 block">Assigned To</span>
            <span className="text-gray-800">{taskFields["Assigned To Name"] || 'N/A'}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-500 block">Project</span>
            <Link to={`/projects/${taskFields.Project?.[0]}`} className="text-blue-600 hover:underline">
                {taskFields["Project Name"] || 'N/A'}
            </Link>
          </div>
        </div>
      </div>

      {/* Add Update Form Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Add a New Update</h2>
        <UpdateForm
          notes={notes}
          updateType={updateType}
          onNotesChange={setNotes}
          onTypeChange={setUpdateType}
          onSubmit={handleUpdateSubmit}
          error={addUpdateMutation.error?.message}
        />
        {addUpdateMutation.isLoading && <p className="text-blue-500 mt-2 text-sm">Saving update...</p>}
      </div>
      
      {/* Existing Updates List */}
      <div className="space-y-4 pt-8 mt-8">
        <h2 className="text-2xl font-semibold text-gray-700">Task History</h2>
        {taskFields.Updates && taskFields.Updates.length > 0 ? (
          taskFields.Updates.map(update => (
            <UpdateDisplay 
              key={update.id} 
              update={update}
              // The backend now provides the owner's name directly
              userName={update.update_owner_name || 'Unknown User'} 
            />
          ))
        ) : (
          <div className="text-center py-6 text-gray-500 border-t">No updates have been added to this task yet.</div>
        )}
      </div>
    </div>
  );
}