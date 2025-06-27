import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAllUpdates } from '../api';
import UpdateDisplay from './UpdateDisplay';
import { Link } from 'react-router-dom';

export default function Updates() {
  // Get the logged-in user's airtable_id from localStorage.
  // In your Login.jsx, this is stored under the key "secretKey".
  const userId = localStorage.getItem("secretKey");

  const { data: updates, isLoading, error } = useQuery({
    // The query key now includes the userId. This serves two purposes:
    // 1. It makes the query unique for each user, preventing cache conflicts.
    // 2. It passes the userId to the fetchAllUpdates function.
    queryKey: ["allUpdates", { userId }],
    queryFn: fetchAllUpdates,
    // The query will only execute if a userId is successfully retrieved from localStorage.
    enabled: !!userId,
  });

  // Handle case where user is not logged in.
  if (!userId) {
    return <div className="text-center py-20 text-red-500">You must be logged in to view updates.</div>;
  }

  if (isLoading) return <div className="text-center py-20 text-gray-500">Loading your updates...</div>;
  if (error) return <div className="text-center py-20 text-red-500">Error loading updates: {error.message}</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Updates Feed</h1>
        <p className="text-gray-500 mt-1">A timeline of all recent updates created by you across all projects and tasks.</p>
      </div>

      <div className="space-y-8">
        {updates && updates.length > 0 ? (
          updates.map(update => (
            <div key={update.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="pb-4 mb-4 border-b border-gray-200">
                <p className="text-sm text-gray-500">
                  Associated with:
                  <Link to={`/projects/${update.project_airtable_id}`} className="font-semibold text-blue-600 hover:underline ml-1">
                    {update.project_name || "N/A"}
                  </Link>
                  {update.task_name && (
                    <>
                      <span className="mx-2">/</span>
                      <Link to={`/tasks/${update.task_airtable_id}`} className="font-semibold text-gray-700 hover:underline">
                        {update.task_name}
                      </Link>
                    </>
                  )}
                </p>
              </div>

              <UpdateDisplay
                update={update}
                userName={update.update_owner_name || 'Unknown User'}
              />
            </div>
          ))
        ) : (
          <p className="text-center py-12 text-gray-500">You haven't created any updates yet.</p>
        )}
      </div>
    </div>
  );
}