import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTasksByIds, updateTask } from '../api/airtable';
import { CalendarIcon, BeakerIcon } from '@heroicons/react/24/outline';

const TASK_STATUS_OPTIONS = ["To Do", "In Progress", "Done", "Blocked"];
const STATUS_COLORS = {
    "To Do": "bg-gray-200 text-gray-800",
    "In Progress": "bg-blue-200 text-blue-800",
    "Done": "bg-green-200 text-green-800",
    "Blocked": "bg-red-200 text-red-800",
};

export default function Tasks() {
    const queryClient = useQueryClient();
    
    // Read the array of task IDs from localStorage.
    // useMemo ensures this only runs once on initial render.
    const taskIds = useMemo(() => JSON.parse(localStorage.getItem("taskIds") || "[]"), []);

    // Use the simple and correct fetchTasksByIds function.
    // The query key now depends on the array of taskIds.
    const { data: tasks = [], isLoading, error } = useQuery({
        queryKey: ['userTasks', taskIds],
        queryFn: () => fetchTasksByIds(taskIds),
        enabled: taskIds.length > 0, // Only run the query if there are task IDs
    });

    const updateTaskMutation = useMutation({
        mutationFn: ({ taskId, newStatus }) => updateTask(taskId, { "Status": newStatus }),
        onSuccess: () => {
            // When a task is updated, invalidate the query to refetch the latest data.
            queryClient.invalidateQueries(['userTasks', taskIds]);
        },
        onError: (err) => {
            console.error("Failed to update task status:", err);
        }
    });

    const handleStatusChange = (taskId, newStatus) => {
        updateTaskMutation.mutate({ taskId, newStatus });
    };
    
    // Group tasks by Project Name using useMemo for efficiency
    const tasksByProject = useMemo(() => {
        if (!tasks) return {};
        return tasks.reduce((acc, task) => {
            // The project name is looked up from Airtable and available directly.
            const projectName = task.fields["Project Name"]?.[0] || "Uncategorized";
            if (!acc[projectName]) {
                acc[projectName] = [];
            }
            acc[projectName].push(task);
            return acc;
        }, {});
    }, [tasks]);
    
    if (isLoading) return <div className="text-center py-20 text-gray-500">Loading your tasks...</div>;
    if (error) return <div className="text-center py-20 text-red-500">Error loading tasks: {error.message}</div>;

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-semibold text-gray-800">My Tasks</h1>
                <p className="text-gray-500 mt-1">All tasks assigned to you, grouped by project.</p>
            </div>
            
            {tasks.length === 0 ? (
                <div className="text-center bg-gray-50 py-16 rounded-lg">
                    <BeakerIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks assigned</h3>
                    <p className="mt-1 text-sm text-gray-500">You currently have no tasks. Great job!</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(tasksByProject).map(([projectName, projectTasks]) => (
                        <div key={projectName} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-primary mb-4">{projectName}</h2>
                            <div className="space-y-4">
                                {projectTasks.map(task => (
                                    <div key={task.id} className="border border-gray-200 rounded-md p-4 bg-gray-50/50">
                                        <div className="flex flex-col md:flex-row justify-between md:items-center">
                                            <h3 className="text-lg font-semibold text-gray-900">{task.fields["Task Name"]}</h3>
                                            <select
                                                value={task.fields.Status}
                                                onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                                className={`text-xs font-medium rounded-full px-3 py-1 border-0 focus:ring-2 focus:ring-offset-1 ${STATUS_COLORS[task.fields.Status]}`}
                                                disabled={updateTaskMutation.isLoading}
                                            >
                                                {TASK_STATUS_OPTIONS.map(status => (
                                                    <option key={status} value={status}>{status}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <p className="mt-2 text-sm text-gray-600">{task.fields.Description}</p>
                                        <div className="flex items-center text-xs text-gray-500 mt-3">
                                            <CalendarIcon className="h-4 w-4 mr-1.5"/>
                                            <span>Due: {task.fields["Due Date"]}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
