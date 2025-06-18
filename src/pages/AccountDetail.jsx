import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchAccountById, fetchProjectsByIds } from "../api/airtable";
import React from "react";

export default function AccountDetail() {
  const { id } = useParams();

  const { data: account, isLoading, error } = useQuery({
    queryKey: ["account", id],
    queryFn: () => fetchAccountById(id),
    enabled: !!id,
    onError: (err) => {
      console.error("[AccountDetail] Error fetching account:", err);
    }
  });

  const projectIds = account?.fields?.Projects || [];

  const {
    data: projects,
    isLoading: projectsLoading,
    error: projectsError,
  } = useQuery({
    queryKey: ["accountProjects", projectIds],
    queryFn: () => fetchProjectsByIds(projectIds),
    enabled: projectIds.length > 0,
  });

  if (isLoading) return <div className="text-center py-20 text-lg text-gray-400">Loading account details...</div>;
  if (error) return <div className="text-red-500 text-center py-10">Error loading account: {error.message}</div>;
  if (!account || !account.fields) return <div className="text-center py-10 text-gray-500">No account data found.</div>;

  const name = account.fields["Account Name"] || "Unnamed Account";
  const description = account.fields["Account Description"] || <span className="italic">No description provided.</span>;
  const accountType = account.fields["Account Type"] || <span className="italic">N/A</span>;

  return (
    <div>
      <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
        <ol className="list-none p-0 inline-flex">
          <li className="flex items-center">
            <Link to="/accounts" className="hover:text-primary hover:underline">Accounts</Link>
            <svg className="fill-current w-3 h-3 mx-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"/></svg>
          </li>
          <li className="flex items-center">
            <span className="font-semibold text-gray-700">{name}</span>
          </li>
        </ol>
      </nav>
      <div className="bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8 rounded-xl shadow-lg mb-8 border border-gray-100">
        <div className="text-xl sm:text-2xl font-bold text-primary mb-2">{name}</div>
        <div className="text-sm text-gray-600 mb-3">
          <span className="font-mono bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
            {accountType}
          </span>
        </div>
        <div className="mt-2 text-gray-700 prose max-w-none">{description}</div>
      </div>

      <h2 className="text-xl font-semibold mb-4 text-primary">Associated Projects</h2>
      {projectsLoading ? (
        <div className="text-center py-8 text-gray-400">Loading projects...</div>
      ) : projectsError ? (
        <div className="text-red-500 bg-red-50 p-4 rounded-md">Error loading projects: {projectsError.message}</div>
      ) : projects?.length > 0 ? (
        <div className="space-y-4">
          {projects.map((proj) => (
            <Link
              to={`/projects/${proj.id}`}
              key={proj.id}
              className="block bg-white p-4 sm:p-5 rounded-lg shadow hover:shadow-md transition-shadow duration-150 border border-gray-100"
            >
              <div className="font-semibold text-md text-gray-800">{proj.fields["Project Name"] || "Unnamed Project"}</div>
              <div className="text-sm text-gray-500 mt-1">
                Status: <span className="font-medium text-gray-600">{proj.fields["Project Status"] || "N/A"}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 bg-gray-50 p-6 rounded-md text-center italic">No projects found for this account.</div>
      )}
    </div>
  );
}
