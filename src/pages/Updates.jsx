import { useQuery } from "@tanstack/react-query";
import { fetchUpdatesByIds, fetchProjectsByIds } from "../api/airtable";
import React, { useMemo } from "react";
import { Link } from "react-router-dom";

export default function Updates() {
  const updateIds = JSON.parse(localStorage.getItem("updateIds") || "[]");

  // Fetch updates
  const { data: updates, isLoading, error } = useQuery({
    queryKey: ["userSpecificUpdates", updateIds],
    queryFn: () => fetchUpdatesByIds(updateIds),
    enabled: updateIds.length > 0,
    onError: (err) => {
      console.error("[UpdatesPage] Error fetching updates:", err);
    },
  });

  // Extract unique project IDs from updates
  const projectIds = useMemo(() => {
    if (!updates) return [];
    const ids = updates
      .map((u) => u.fields.Project && u.fields.Project[0])
      .filter(Boolean);
    // Remove duplicates
    return Array.from(new Set(ids));
  }, [updates]);

  // Fetch all projects in one go
  const { data: projects } = useQuery({
    queryKey: ["projectsForUpdates", projectIds],
    queryFn: () => fetchProjectsByIds(projectIds),
    enabled: projectIds.length > 0,
  });

  // Map project ID to project name
  const projectIdToName = useMemo(() => {
    if (!projects) return {};
    const map = {};
    projects.forEach((proj) => {
      map[proj.id] = proj.fields["Project Name"] || proj.id;
    });
    return map;
  }, [projects]);

  if (isLoading) return <div className="text-center py-20 text-lg text-gray-400">Loading your updates...</div>;
  if (error) return <div className="text-red-500 text-center py-10">Error loading updates: {error.message}</div>;
  if (!updates || updates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-300 mb-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
        </svg>
        <div className="text-xl mb-2 font-semibold text-gray-600">No updates found.</div>
        <p className="text-gray-400">Updates you've made or are linked to will appear here.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-8 text-primary font-merriweather">My Updates</h1>
      <div className="space-y-5">
        {updates.map((record) => {
          const projectId = record.fields.Project && record.fields.Project[0];
          const projectName = projectIdToName[projectId] || projectId || "N/A";
          return (
            <div 
              key={record.id}
              className="block bg-white p-5 sm:p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-150"
            >
              {/* Update content (not wrapped in Link) */}
              <div className="font-semibold text-gray-800">
                Date: <span className="font-normal text-gray-600">{record.fields.Date ? new Date(record.fields.Date).toLocaleDateString() : "N/A"}</span>
              </div>
              <div className="mt-2">
                <strong className="text-gray-700">Notes:</strong>
                <p className="text-gray-600 whitespace-pre-wrap mt-1">{record.fields.Notes || <span className="italic">No notes.</span>}</p>
              </div>
              <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                <span>Project: </span>
                {projectId ? (
                  <Link
                    to={`/projects/${projectId}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {projectName}
                  </Link>
                ) : (
                  <span className="italic">N/A</span>
                )}
              </div>
              
              {/* View update details link - separated from content */}
              <div className="mt-4 text-right">
                <Link
                  to={`/updates/${record.id}`}
                  className="inline-block px-4 py-2 bg-blue-50 text-primary rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
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