import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchProjectById, fetchUpdatesByIds, updateRecord, fetchTasksByIds } from "../api"; // --- NEW: Added fetchTasksByIds
import React from "react";

export default function ProjectDetail() {
  const { id } = useParams();

  const { data: project, isLoading, error } = useQuery({
    queryKey: ["project", id],
    queryFn: () => fetchProjectById(id),
    enabled: !!id,
    onError: (err) => {
      console.error("[ProjectDetail] Error fetching project:", err);
    }
  });

  const updateIds = project?.fields?.Updates || [];
  const { data: updates, isLoading: updatesLoading, error: updatesError } = useQuery({
    queryKey: ["projectUpdates", updateIds],
    queryFn: () => fetchUpdatesByIds(updateIds),
    enabled: updateIds.length > 0,
  });
  
  // --- NEW: Logic to get Task names for each update ---
  const taskIds = React.useMemo(() => {
    if (!updates) return [];
    const ids = updates
      .map((u) => u.fields.Task && u.fields.Task[0])
      .filter(Boolean);
    return Array.from(new Set(ids));
  }, [updates]);

  const { data: tasks } = useQuery({
    queryKey: ["tasksForProjectUpdates", taskIds],
    queryFn: () => fetchTasksByIds(taskIds),
    enabled: taskIds.length > 0,
  });

  const taskIdToName = React.useMemo(() => {
    if (!tasks) return {};
    const map = {};
    tasks.forEach((task) => {
      map[task.id] = task.fields["Task Name"] || task.id;
    });
    return map;
  }, [tasks]);
  // --- END NEW LOGIC ---

  const [statusValue, setStatusValue] = React.useState("");
  const [startDateValue, setStartDateValue] = React.useState("");
  const [endDateValue, setEndDateValue] = React.useState("");
  const [value, setValue] = React.useState("");
  const [description1, setDescription] = React.useState("");

  React.useEffect(() => {
    if (project?.fields) {
      setStatusValue(project.fields["Project Status"] || "");
      setStartDateValue(project.fields["Start Date"] || "");
      setEndDateValue(project.fields["End Date"] || "");
      setValue(project.fields["Project Value"] || "");
      setDescription(project.fields["Project Description"] || "");
    }
  }, [project]);

  const handleUpdate = async () => {
    try {
      const numericValue = parseFloat(value) || 0;
      await updateRecord("Projects", id, {
        "Project Status": statusValue,
        "Start Date": startDateValue,
        "End Date": endDateValue,
        "Project Value": numericValue,
        "Project Description": description1,
      });
      alert("Project updated successfully!");
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update project.");
    }
  };

  if (isLoading) return <div className="text-center py-20 text-lg text-gray-400">Loading project details...</div>;
  if (error) return <div className="text-red-500 text-center py-10">Error loading project: {error.message}</div>;
  if (!project || !project.fields) return <div className="text-center py-10 text-gray-500">No project data found.</div>;

  const name = project.fields["Project Name"] || "Unnamed Project";
  const description = project.fields["Project Description"] || <span className="italic">No description.</span>;
  const accountNameArr = project.fields["Account Name (from Account)"] || [];
  const accountName = accountNameArr[0] || "N/A";
  const projectValue = project.fields["Project Value"] || "N/A";

  return (
    <div>
      <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
        <ol className="list-none p-0 inline-flex">
          <li className="flex items-center">
            <Link to="/projects" className="hover:text-primary hover:underline">Projects</Link>
            <svg className="fill-current w-3 h-3 mx-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"/></svg>
          </li>
          <li className="flex items-center">
            <span className="font-semibold text-gray-700">{name}</span>
          </li>
        </ol>
      </nav>

      <div className="bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8 rounded-xl shadow-lg mb-8 border border-gray-100">
        <h1 className="text-xl sm:text-2xl font-bold text-primary mb-2">{name}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
          <p>
            <strong>Status:</strong>
            <select
              className="ml-2 border border-gray-300 rounded px-2 py-1"
              value={statusValue}
              onChange={(e) => setStatusValue(e.target.value)}
            >
              <option value="Negotiation">Negotiation</option>
              <option value="Need Analysis">Need Analysis</option>
              <option value="Closed Won">Closed Won</option>
              <option value="Closed Lost">Closed Lost</option>
            </select>
          </p>
          <p><strong>Account:</strong> <span className="text-gray-700">{accountName}</span></p>
          <p>
            <strong>Project Value:</strong>
            <input
              type="text"
              className="ml-2 border border-gray-300 rounded px-2 py-1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </p>
          <p>
            <strong>Start Date:</strong>
            <input
              type="date"
              className="ml-2 border border-gray-300 rounded px-2 py-1"
              value={startDateValue}
              onChange={(e) => setStartDateValue(e.target.value)}
            />
          </p>
          <p>
            <strong>End Date:</strong>
            <input
              type="date"
              className="ml-2 border border-gray-300 rounded px-2 py-1"
              value={endDateValue}
              onChange={(e) => setEndDateValue(e.target.value)}
            />
          </p>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-semibold mb-1">Description:</label>
          <textarea
            className="w-full border border-gray-300 rounded p-2 text-sm"
            rows={4}
            value={description1}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={handleUpdate}
        >
          Save Changes
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-4 text-primary">Updates for this Project</h2>
      <div className="space-y-4">
        {updatesLoading ? (
          <div className="text-center py-8 text-gray-400">Loading updates...</div>
        ) : updatesError ? (
          <div className="text-red-500 bg-red-50 p-4 rounded-md">Error loading updates: {updatesError.message}</div>
        ) : updates && updates.length > 0 ? (
          updates.map((update) => {
            // --- NEW: Get Task details for display ---
            const taskId = update.fields.Task && update.fields.Task[0];
            const taskName = taskIdToName[taskId];

            return (
              <Link
                to={`/updates/${update.id}`}
                key={update.id}
                className="block bg-white p-4 sm:p-5 rounded-lg shadow border border-gray-100 hover:shadow-md transition-shadow duration-150 group"
              >
                {/* Removed the old header with start/end date */}
                <div>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {update.fields.Notes || <span className="italic">No notes provided.</span>}
                  </p>
                </div>
                {/* --- UPDATED: Footer with Date and new Task link --- */}
                <div className="flex justify-between items-center text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                  {update.fields.Date ? (
                    <div>
                      <strong>Date:</strong> {new Date(update.fields.Date).toLocaleDateString()}
                    </div>
                  ) : <div></div>}
                  {taskId && taskName && (
                    <div>
                      <strong>Task: </strong>
                      <Link to={`/tasks/${taskId}`} className="text-primary hover:underline font-medium" onClick={(e) => e.stopPropagation()}>
                        {taskName}
                      </Link>
                    </div>
                  )}
                </div>
              </Link>
            )
          })
        ) : (
          <div className="text-gray-500 bg-gray-50 p-6 rounded-md text-center italic">No updates found for this project.</div>
        )}
      </div>
    </div>
  );
}