import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTaskById, createUpdate, updateUser, updateTask, fetchUpdatesByIds, fetchUserById } from '../api';
import UpdateForm from './UpdateForm';
import UpdateDisplay from './UpdateDisplay';

// A component to render the list of updates for the task
function TaskUpdateList({ updateIds }) {
  // We no longer need the hardcoded userName from localStorage here.
  const { data: updates, isLoading } = useQuery({
    queryKey: ['taskUpdates', updateIds],
    queryFn: () => fetchUpdatesByIds(updateIds),
    enabled: !!updateIds && updateIds.length > 0,
  });

  if (isLoading) return <div className="text-gray-500">Loading updates...</div>;
  if (!updates || updates.length === 0) {
    return <div className="text-center py-6 text-gray-500 border-t mt-8">No updates have been added to this task yet.</div>;
  }

  return (
    <div className="space-y-4 border-t pt-8 mt-8">
      <h2 className="text-xl font-semibold text-gray-700">Task Updates</h2>
      {updates.map(update => (
        // --- THIS IS THE FIX ---
        // We now get the user's name directly from the update record's new lookup field.
        <UpdateDisplay 
          key={update.id} 
          update={update} 
          userName={update.fields["Update Owner Name"]?.[0] || 'Unknown User'} 
        />
      ))}
    </div>
  );
}


export default function TaskDetail() {
  const { taskId } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [notes, setNotes] = useState("");
  const [updateType, setUpdateType] = useState("Call");

  const responderId = localStorage.getItem("userRecordId") || "";

  const { data: task, isLoading: isTaskLoading, error: taskError } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => fetchTaskById(taskId),
    enabled: !!taskId,
  });

  const addUpdateMutation = useMutation({
    mutationFn: ({ taskData, updatePayload }) => createUpdate({
       ...updatePayload,
       "Task": taskData.id, // Pass the task's Airtable ID
       "Project": taskData.fields.Project[0], // Pass the project's Airtable ID
       "Update Owner": responderId, // Pass the current user's Airtable ID
     }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      setNotes("");
      setUpdateType("Call");
    },
    onError: (err) => {
      console.error("Failed to add update:", err);
    },
  });

  const handleUpdateSubmit = () => {
    if (!notes.trim()) {
      return;
    }
    addUpdateMutation.mutate({
      taskData: task,
      updatePayload: {
        "Notes": notes,
        "Update Type": updateType,
        "Date": new Date().toISOString().slice(0, 10),
      },
    });
  };

  if (isTaskLoading) return <div className="text-center py-20 text-gray-500">Loading task...</div>;
  if (taskError) return <div className="text-center py-20 text-red-500">Error loading task: {taskError.message}</div>;

  const taskFields = task.fields;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <span className="text-gray-800">{taskFields["Assigned To Name"]?.[0] || 'N/A'}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-500 block">Project</span>
            <Link to={`/projects/${taskFields.Project?.[0]}`} className="text-primary hover:underline">
                {taskFields["Project Name"]?.[0] || 'N/A'}
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
        {addUpdateMutation.isLoading && <p className="text-blue-500 mt-2">Saving update...</p>}
        {addUpdateMutation.isSuccess && <p className="text-green-500 mt-2">Update added successfully!</p>}
      </div>
      
      {/* Existing Updates List */}
      <TaskUpdateList updateIds={taskFields.Updates} />
    </div>
  );
}