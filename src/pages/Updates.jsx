import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUpdatesByIds } from '../api';
import UpdateDisplay from './UpdateDisplay';
import { Link } from 'react-router-dom';

export default function Updates() {
  // 1. Get the current user's specific update IDs from localStorage.
  const updateIds = JSON.parse(localStorage.getItem("updateIds") || "[]");

  // 2. Fetch only the updates matching those IDs.
  const { data: updates, isLoading, error } = useQuery({
    queryKey: ["userSpecificUpdates", updateIds],
    queryFn: () => fetchUpdatesByIds(updateIds),
    enabled: updateIds.length > 0, // The query will only run if there are IDs to fetch.
    onError: (err) => {
      console.error("[UpdatesPage] Error fetching user-specific updates:", err);
    },
  });

  if (isLoading) return <div className="text-center py-20 text-lg text-gray-400">Loading your updates...</div>;
  if (error) return <div className="text-red-500 text-center py-10">Error loading your updates: {error.message}</div>;

  // 3. Display a user-friendly message if no updates are found for the user.
  if (!updates || updates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-300 mb-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
        </svg>
        <div className="text-xl mb-2 font-semibold text-gray-600">No Updates Found</div>
        <p className="text-gray-400">Updates you create will appear here.</p>
         <Link to="/create-update" className="mt-6 bg-blue-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow">
            Create Your First Update
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Updates</h1>
        <p className="text-gray-500 mt-1">A timeline of all updates you have created.</p>
      </div>

      <div className="space-y-8">
        {updates.map(record => {
          // 4. Correctly destructure data from the 'fields' object.
          const { fields } = record;
          const projectId = fields.Project?.[0];
          const taskId = fields.Task?.[0];
          const projectName = fields["Project Name"] || "N/A";
          const taskName = fields["Task Name"];
          const userName = fields["Update Owner Name"]?.[0] || 'Unknown User';

          // 5. Create a compatible object for the UpdateDisplay component.
          const updateForDisplay = {
            notes: fields.Notes,
            date: fields.Date,
            update_type: fields["Update Type"],
          };

          return (
            <div key={record.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="pb-4 mb-4 border-b border-gray-200">
                <p className="text-sm text-gray-500">
                  Associated with: 
                  {projectId ? (
                     <Link to={`/projects/${projectId}`} className="font-semibold text-blue-600 hover:underline ml-1">
                        {projectName}
                     </Link>
                  ) : <span className="font-semibold text-gray-700 ml-1">{projectName}</span>}
                 
                  {taskName && taskId && (
                    <>
                      <span className="mx-2">/</span>
                      <Link to={`/tasks/${taskId}`} className="font-semibold text-gray-700 hover:underline">
                        {taskName}
                      </Link>
                    </>
                  )}
                </p>
              </div>

              <UpdateDisplay
                update={updateForDisplay}
                userName={userName}
              />
               <div className="mt-4 text-right">
                 <Link
                   to={`/updates/${record.id}`}
                   className="inline-block px-4 py-2 bg-gray-50 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                 >
                   View Details
                 </Link>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}