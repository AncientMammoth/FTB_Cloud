import React, { useState, useEffect } from "react";
import { createProject, fetchAccountsByIds, updateUser } from "../api/airtable";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

// Project status options
const PROJECT_STATUS_OPTIONS = [
  "Negotiation",
  "Need Analysis",
  "Closed Won",
  "Closed Lost",
];

export default function ProjectCreation() {
  const [fields, setFields] = useState({
    "Project Name": "",
    "Project Status": "",
    "Start Date": "",
    "End Date": "",
    "Account": "",
    "Project Value": "",
    "Project Description": "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [accounts, setAccounts] = useState([]);

  // Get current user info from localStorage
  const projectOwnerId = localStorage.getItem("userRecordId") || "";
  const userName = localStorage.getItem("userName") || "Current User";

  // Fetch user's accounts for the Account dropdown
  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem("accountIds") || "[]");
    if (ids.length) {
      fetchAccountsByIds(ids).then(setAccounts);
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      // 1. Create the project
      const project = await createProject({
        "Project Name": fields["Project Name"],
        "Project Status": fields["Project Status"],
        "Start Date": fields["Start Date"], // YYYY-MM-DD
        "End Date": fields["End Date"],     // YYYY-MM-DD
        "Account": fields["Account"] ? [fields["Account"]] : [],
        "Project Value": fields["Project Value"] ? Number(fields["Project Value"]) : undefined,
        "Project Description": fields["Project Description"],
        "Project Owner": projectOwnerId ? [projectOwnerId] : [],
      });

      // 2. Update the user's Projects field to include this project
      if (project && project.id && projectOwnerId) {
        const prevProjects = JSON.parse(localStorage.getItem("projectIds") || "[]");
        const updatedProjects = [...new Set([...prevProjects, project.id])];
        await updateUser(projectOwnerId, { "Projects": updatedProjects });
        localStorage.setItem("projectIds", JSON.stringify(updatedProjects));
      }

      setFields({
        "Project Name": "",
        "Project Status": "",
        "Start Date": "",
        "End Date": "",
        "Account": "",
        "Project Value": "",
        "Project Description": "",
      });
      setSuccess(true);
    } catch (err) {
      setError("Failed to create project.");
    }
    setLoading(false);
  }

  return (
    <>
     
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-white px-2">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-2xl flex flex-col gap-8 pt-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
            Create New Project
          </h2>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-center font-medium">
              Project created successfully!
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-base text-gray-700 font-medium mb-1">
              Project Name
            </label>
            <input
              required
              placeholder="Start typing..."
              className="border border-gray-200 rounded-lg px-4 py-3 text-lg bg-white focus:outline-none focus:border-blue-400 transition"
              value={fields["Project Name"]}
              onChange={e =>
                setFields(f => ({ ...f, "Project Name": e.target.value }))
              }
            />
          </div>

          {/* Project Status Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-base text-gray-700 font-medium mb-1">
              Project Status
            </label>
            <select
              required
              className="border border-gray-200 rounded-lg px-4 py-3 text-lg bg-white focus:outline-none focus:border-blue-400 transition"
              value={fields["Project Status"]}
              onChange={e =>
                setFields(f => ({ ...f, "Project Status": e.target.value }))
              }
            >
              <option value="" disabled>
                Select status
              </option>
              {PROJECT_STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 sm:flex-row sm:gap-8">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-base text-gray-700 font-medium mb-1">
                Start Date
              </label>
              <input
                required
                type="date"
                className="border border-gray-200 rounded-lg px-4 py-3 text-lg bg-white focus:outline-none focus:border-blue-400 transition"
                value={fields["Start Date"]}
                onChange={e =>
                  setFields(f => ({ ...f, "Start Date": e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-base text-gray-700 font-medium mb-1">
                End Date
              </label>
              <input
                required
                type="date"
                className="border border-gray-200 rounded-lg px-4 py-3 text-lg bg-white focus:outline-none focus:border-blue-400 transition"
                value={fields["End Date"]}
                onChange={e =>
                  setFields(f => ({ ...f, "End Date": e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-base text-gray-700 font-medium mb-1">
              Project Owner
            </label>
            <div className="flex items-center gap-2">
              <span className="bg-gray-100 text-gray-700 rounded px-3 py-1 text-base font-semibold">
                {userName}
              </span>
              <span className="text-xs text-gray-400">(default)</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-base text-gray-700 font-medium mb-1">
              Account
            </label>
            <select
              required
              className="border border-gray-200 rounded-lg px-4 py-3 text-lg bg-white focus:outline-none focus:border-blue-400 transition"
              value={fields["Account"]}
              onChange={e =>
                setFields(f => ({ ...f, "Account": e.target.value }))
              }
            >
              <option value="" disabled>
                Select account
              </option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.fields["Account Name"]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-base text-gray-700 font-medium mb-1">
              Project Value
            </label>
            <input
              type="number"
              min="0"
              placeholder="Enter value..."
              className="border border-gray-200 rounded-lg px-4 py-3 text-lg bg-white focus:outline-none focus:border-blue-400 transition"
              value={fields["Project Value"]}
              onChange={e =>
                setFields(f => ({ ...f, "Project Value": e.target.value }))
              }
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-base text-gray-700 font-medium mb-1">
              Project Description
            </label>
            <textarea
              placeholder="Add a description..."
              className="border border-gray-200 rounded-lg px-4 py-3 text-lg bg-white focus:outline-none focus:border-blue-400 transition min-h-[90px]"
              value={fields["Project Description"]}
              onChange={e =>
                setFields(f => ({ ...f, "Project Description": e.target.value }))
              }
            />
          </div>

          {error && (
            <div className="text-red-600 text-center font-semibold">{error}</div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`rounded-lg px-8 py-3 text-white text-lg font-semibold shadow-sm transition ${
                loading
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>

    </>
  );
}
