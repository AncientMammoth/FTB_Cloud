import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createUpdate, fetchProjectsByIds, updateUser } from "../api/airtable";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const UPDATE_TYPE_OPTIONS = [
  "Email",
  "Call",
  "Online Meeting",
  "Physical Meeting",
];

export default function UpdateCreation() {
  const [fields, setFields] = useState({
    "Notes": "",
    "Date": "",
    "Update Type": "",
    "Project": "",
    "Attachments": [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  // Get current user info from localStorage
  const updateOwnerId = localStorage.getItem("userRecordId") || "";
  const userName = localStorage.getItem("userName") || "Current User";

  // Fetch user's projects for the Project dropdown
  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem("projectIds") || "[]");
    fetchProjectsByIds(ids).then(setProjects);
  }, []);

  // Handle file input
  function handleFileChange(e) {
    setFields(f => ({
      ...f,
      "Attachments": Array.from(e.target.files),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // 1. If attachments are present, upload them to Airtable first
      let attachmentsField = [];
      if (fields.Attachments.length > 0) {
        // Airtable expects: [{url: "..."}]
        // You must upload files to a public URL (e.g., S3, Cloudinary, etc.) before attaching.
        // For demo, we'll skip actual upload and ignore attachments if you don't have a backend for it.
        // If you have a backend, upload files there and get URLs, then:
        // attachmentsField = [{ url: "https://..." }, ...]
        // For now, we'll leave it empty and show a warning below.
      }

      // 2. Create the update
      const update = await createUpdate({
        "Notes": fields["Notes"],
        "Date": fields["Date"],
        "Update Type": fields["Update Type"],
        "Project": fields["Project"] ? [fields["Project"]] : [],
        "Update Owner": updateOwnerId ? [updateOwnerId] : [],
        ...(attachmentsField.length > 0 ? { "Attachments": attachmentsField } : {}),
      });

      // 3. Update the user's Updates field to include this update
      if (update && update.id && updateOwnerId) {
        const prevUpdates = JSON.parse(localStorage.getItem("updateIds") || "[]");
        const updatedUpdates = [...new Set([...prevUpdates, update.id])];
        await updateUser(updateOwnerId, { "Updates": updatedUpdates });
        localStorage.setItem("updateIds", JSON.stringify(updatedUpdates));
      }

      setFields({
        "Notes": "",
        "Date": "",
        "Update Type": "",
        "Project": "",
        "Attachments": [],
      });
      setSuccess(true);
    } catch (err) {
      setError("Failed to create update.");
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
            Create New Update
          </h2>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-center font-medium">
              Update created successfully!
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-base text-gray-700 font-medium mb-1">
              Project
            </label>
            <select
              required
              className="border border-gray-200 rounded-lg px-4 py-3 text-lg bg-white focus:outline-none focus:border-blue-400 transition"
              value={fields["Project"]}
              onChange={e =>
                setFields(f => ({ ...f, "Project": e.target.value }))
              }
            >
              <option value="" disabled>
                Select project
              </option>
              {projects.map(proj => (
                <option key={proj.id} value={proj.id}>
                  {proj.fields["Project Name"]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-base text-gray-700 font-medium mb-1">
              Update Type
            </label>
            <select
              required
              className="border border-gray-200 rounded-lg px-4 py-3 text-lg bg-white focus:outline-none focus:border-blue-400 transition"
              value={fields["Update Type"]}
              onChange={e =>
                setFields(f => ({ ...f, "Update Type": e.target.value }))
              }
            >
              <option value="" disabled>
                Select update type
              </option>
              {UPDATE_TYPE_OPTIONS.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-base text-gray-700 font-medium mb-1">
              Notes
            </label>
            <textarea
              required
              placeholder="Add notes..."
              className="border border-gray-200 rounded-lg px-4 py-3 text-lg bg-white focus:outline-none focus:border-blue-400 transition min-h-[90px]"
              value={fields["Notes"]}
              onChange={e =>
                setFields(f => ({ ...f, "Notes": e.target.value }))
              }
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-base text-gray-700 font-medium mb-1">
              Attachments
            </label>
            <input
              type="file"
              multiple
              className="block border border-gray-200 rounded-lg px-4 py-2 bg-white focus:outline-none focus:border-blue-400 transition"
              onChange={handleFileChange}
            />
            <span className="text-xs text-gray-400">
              {/* Show selected file names */}
              {fields.Attachments.length > 0 &&
                Array.from(fields.Attachments)
                  .map(f => f.name)
                  .join(", ")}
            </span>
            <span className="text-xs text-yellow-500">
              (File uploads require a backend or public file host. Attachments will not be uploaded unless implemented.)
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-base text-gray-700 font-medium mb-1">
              Date
            </label>
            <input
              type="date"
              required
              className="border border-gray-200 rounded-lg px-4 py-3 text-lg bg-white focus:outline-none focus:border-blue-400 transition"
              value={fields["Date"]}
              onChange={e =>
                setFields(f => ({ ...f, "Date": e.target.value }))
              }
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-base text-gray-700 font-medium mb-1">
              Update Owner
            </label>
            <div className="flex items-center gap-2">
              <span className="bg-gray-100 text-gray-700 rounded px-3 py-1 text-base font-semibold">
                {userName}
              </span>
              <span className="text-xs text-gray-400">(default)</span>
            </div>
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
              {loading ? "Creating..." : "Create Update"}
            </button>
          </div>
        </form>
      </div>
   
    </>
  );
}
