import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchUpdateById } from "../api/airtable";
import React from "react";

export default function UpdateDetail() {
  const { id } = useParams();

  const { data: update, isLoading, error } = useQuery({
    queryKey: ["update", id],
    queryFn: () => fetchUpdateById(id),
    enabled: !!id,
    onError: (err) => {
      console.error("[UpdateDetail] Error fetching update:", err);
    }
  });

  if (isLoading) return <div className="text-center py-20 text-lg text-gray-400">Loading update details...</div>;
  if (error) return <div className="text-red-500 text-center py-10">Error loading update: {error.message}</div>;
  if (!update || !update.fields) return <div className="text-center py-10 text-gray-500">No update data found.</div>;

  const fields = update.fields;
  const createdBy = fields["Created By"];
  const projectArr = fields["Project"] || [];
  const updateOwnerArr = fields["Update Owner"] || [];

  return (
    <div>
      <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
        <ol className="list-none p-0 inline-flex">
          <li className="flex items-center">
            <Link to="/projects" className="hover:text-primary hover:underline">Projects</Link>
            <svg className="fill-current w-3 h-3 mx-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"/></svg>
          </li>
          <li className="flex items-center">
            <Link to={`/projects/${projectArr[0]}`} className="hover:text-primary hover:underline">
              Project
            </Link>
            <svg className="fill-current w-3 h-3 mx-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"/></svg>
          </li>
          <li className="flex items-center">
            <span className="font-semibold text-gray-700">Update</span>
          </li>
        </ol>
      </nav>

      <div className="bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100">
        <h1 className="text-xl sm:text-2xl font-bold text-primary mb-2">Update Details</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
          <p>
            <strong>Date:</strong>{" "}
            <span className="text-gray-700">{fields.Date || "N/A"}</span>
          </p>
          <p>
            <strong>Update Type:</strong>{" "}
            <span className="text-gray-700">{fields["Update Type"] || "N/A"}</span>
          </p>
          <p>
            <strong>Project:</strong>{" "}
            <Link
              to={`/projects/${projectArr[0]}`}
              className="text-blue-600 hover:underline"
            >
              {projectArr[0] || "N/A"}
            </Link>
          </p>
          <p>
            <strong>Update Owner:</strong>{" "}
            <span className="text-gray-700">
              {updateOwnerArr[0] || "N/A"}
            </span>
          </p>
          <p>
            <strong>Created By:</strong>{" "}
            <span className="text-gray-700">
              {createdBy?.name
                ? `${createdBy.name} (${createdBy.email})`
                : "N/A"}
            </span>
          </p>
          <p>
            <strong>Created Time:</strong>{" "}
            <span className="text-gray-700">
              {update.createdTime
                ? new Date(update.createdTime).toLocaleString()
                : "N/A"}
            </span>
          </p>
        </div>
        <div className="mt-2 text-gray-700">
          <strong>Notes:</strong>
          <div className="bg-white border border-gray-100 rounded p-3 mt-1 text-gray-800 whitespace-pre-wrap">
            {fields.Notes || <span className="italic">No notes provided.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
