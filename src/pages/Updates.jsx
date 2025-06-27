import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAllUpdates } from '../api';
import UpdateDisplay from './UpdateDisplay';
import { Link } from 'react-router-dom';

export default function Updates() {
  const { data: updates, isLoading, error } = useQuery({
    queryKey: ["allUpdates"],
    queryFn: fetchAllUpdates,
  });

  if (isLoading) return <div className="text-center py-20 text-gray-500">Loading all updates...</div>;
  if (error) return <div className="text-center py-20 text-red-500">Error loading updates: {error.message}</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Global Updates Feed</h1>
        <p className="text-gray-500 mt-1">A timeline of all recent updates across all projects and tasks.</p>
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
          <p className="text-center py-12 text-gray-500">No updates found.</p>
        )}
      </div>
    </div>
  );
}