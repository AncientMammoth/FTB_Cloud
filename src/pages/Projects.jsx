import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchProjectsByIds,
  fetchAllUpdates,
  processUpdatesByProject,
  createUpdate,
  updateUser,
  formatDateForAirtable,
} from "../api/airtable";
import { Listbox, Transition } from "@headlessui/react";
import { Fragment } from 'react'; // Add explicit Fragment import
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Link } from "react-router-dom";
import ProjectCard from "./ProjectCard";
import UpdateDisplay from "./UpdateDisplay";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getTodayIST() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 5.5 * 60 * 60000);
  return ist.toISOString().slice(0, 10);
}

function getLastNDays(n) {
  const days = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

const STATUS_OPTIONS = [
  "",
  "Need Analysis",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
];

const UPDATE_TYPES = ["Call", "Email", "Meeting", "Note"];

export default function Projects() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(getTodayIST());
  const [expandedNote, setExpandedNote] = useState(null);
  const [notesByProject, setNotesByProject] = useState({});
  const [updateTypeByProject, setUpdateTypeByProject] = useState({});
  const [errorByProject, setErrorByProject] = useState({});
  const [filteredUpdatesByProject, setFilteredUpdatesByProject] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const updateOwnerId = localStorage.getItem("userRecordId") || "";
  const userName = localStorage.getItem("userName") || "Current User";
  
  // Fix: Initialize project IDs with useState and initializer function to avoid recreating the array on every render
  const [projectIds] = useState(() => JSON.parse(localStorage.getItem("projectIds") || "[]"));

  const {
    data: projects,
    isLoading: projectsLoading,
    error: projectsError,
  } = useQuery({
    queryKey: ["projects", projectIds],
    queryFn: () => fetchProjectsByIds(projectIds),
    enabled: projectIds.length > 0,
  });

  const {
    data: allUpdates = [],
    isLoading: updatesLoading,
    error: updatesError,
  } = useQuery({
    queryKey: ["allUpdates"],
    queryFn: async () => fetchAllUpdates(),
  });

  // Fix: Memoize the processed updates to avoid recalculation on every render
  const processedUpdates = useMemo(() => {
    if (allUpdates.length > 0 && projectIds.length > 0) {
      return processUpdatesByProject(allUpdates, projectIds);
    }
    return {};
  }, [allUpdates, projectIds]);

  // Fix: Update useEffect to use memoized values and avoid unnecessary recalculations
  useEffect(() => {
    // Only run this effect when necessary data is available and not loading
    if (allUpdates.length > 0 && projectIds.length > 0 && !updatesLoading) {
      const formattedDate = formatDateForAirtable(selectedDate);
      
      const filtered = {};
      Object.keys(processedUpdates).forEach((projectId) => {
        const projectUpdates = processedUpdates[projectId] || [];
        const updatesForDate = projectUpdates.filter(
          (update) => update.fields.Date === formattedDate
        );
        filtered[projectId] =
          updatesForDate.length > 0 ? updatesForDate[0] : null;
      });
      
      setFilteredUpdatesByProject(filtered);
    }
  }, [selectedDate, processedUpdates, updatesLoading, projectIds]);

  const createUpdateMutation = useMutation({
    mutationFn: async ({ projectId, notes, updateType }) => {
      const update = await createUpdate({
        Notes: notes,
        Date: selectedDate,
        "Update Type": updateType,
        Project: [projectId],
        "Update Owner": updateOwnerId ? [updateOwnerId] : [],
      });

      if (update && update.id && updateOwnerId) {
        const prevUpdates = JSON.parse(
          localStorage.getItem("updateIds") || "[]"
        );
        const updatedUpdates = [...new Set([...prevUpdates, update.id])];
        await updateUser(updateOwnerId, { Updates: updatedUpdates });
        localStorage.setItem("updateIds", JSON.stringify(updatedUpdates));
      }

      return update;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["allUpdates"]);
    },
    onError: (err, variables) => {
      setErrorByProject((prev) => ({
        ...prev,
        [variables.projectId]: err.message || "Failed to create update.",
      }));
    },
  });

  const handleDateChange = (date) => setSelectedDate(date);
  const handleNotesChange = (projectId, value) =>
    setNotesByProject((prev) => ({ ...prev, [projectId]: value }));
  const handleTypeChange = (projectId, value) =>
    setUpdateTypeByProject((prev) => ({ ...prev, [projectId]: value }));
  const handleCreateUpdate = (projectId) => {
    const notes = notesByProject[projectId]?.trim();
    const updateType = updateTypeByProject[projectId] || "Call";
    setErrorByProject((prev) => ({ ...prev, [projectId]: undefined }));
    if (!notes || !updateType) return;
    createUpdateMutation.mutate(
      { projectId, notes, updateType },
      {
        onSuccess: () => {
          setNotesByProject((prev) => ({ ...prev, [projectId]: "" }));
          setUpdateTypeByProject((prev) => ({ ...prev, [projectId]: "" }));
        },
      }
    );
  };

  const isLoading = projectsLoading || updatesLoading;
  const error = projectsError || updatesError;

  if (isLoading)
    return <div className="text-center py-20 text-gray-400">Loading...</div>;
  if (error)
    return (
      <div className="text-center py-10 text-red-500">
        Error: {error.message}
      </div>
    );
  if (!projects?.length)
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-xl mb-2">No projects found</div>
        <p>Projects linked to your profile will appear here</p>
      </div>
    );

  const last10Days = getLastNDays(10);

  const filteredProjects = projects.filter((project) => {
    const name = project.fields["Project Name"]?.toLowerCase() || "";
    const status = project.fields["Project Status"]?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();

    const matchesSearch = name.includes(search) || status.includes(search);
    const matchesStatus = statusFilter
      ? status === statusFilter.toLowerCase()
      : true;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-semibold text-gray-800">My Projects</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="text-sm font-medium text-gray-600">Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="flex gap-1 flex-wrap mt-2 sm:mt-0">
            {last10Days.map((date) => (
              <button
                key={date}
                onClick={() => handleDateChange(date)}
                className={classNames(
                  "text-xs font-medium px-2 py-1 rounded border",
                  selectedDate === date
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-800 hover:bg-blue-100"
                )}
                title={date}
              >
                {new Date(date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by project name or status..."
          className="border border-gray-300 rounded-md px-4 py-2 text-sm w-full sm:w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="w-full sm:w-1/3">
          <Listbox value={statusFilter} onChange={setStatusFilter}>
            {({ open }) => (
              <div className="relative">
                <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <span className="block truncate">
                    {statusFilter || "All Statuses"}
                  </span>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronUpDownIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </span>
                </Listbox.Button>
                <Transition
                  show={open}
                  as={Fragment} 
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {STATUS_OPTIONS.map((option, idx) => (
                      <Listbox.Option
                        key={idx}
                        className={({ active }) =>
                          classNames(
                            active ? "bg-blue-600 text-white" : "text-gray-900",
                            "cursor-default select-none relative py-2 pl-10 pr-4"
                          )
                        }
                        value={option}
                      >
                        {({ selected, active }) => (
                          <>
                            <span
                              className={classNames(
                                selected ? "font-semibold" : "font-normal",
                                "block truncate"
                              )}
                            >
                              {option || "All Statuses"}
                            </span>
                            {selected && (
                              <span
                                className={classNames(
                                  active ? "text-white" : "text-blue-600",
                                  "absolute inset-y-0 left-0 flex items-center pl-3"
                                )}
                              >
                                <CheckIcon className="h-5 w-5" />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            )}
          </Listbox>
        </div>
      </div>

      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            No projects match your filters.
          </div>
        ) : (
          filteredProjects.map((record) => (
            <ProjectCard
              key={record.id}
              record={record}
              update={filteredUpdatesByProject[record.id]}
              notes={notesByProject[record.id] || ""}
              updateType={updateTypeByProject[record.id] || "Call"}
              updateTypeOptions={UPDATE_TYPES}
              error={errorByProject[record.id]}
              onNotesChange={(val) => handleNotesChange(record.id, val)}
              onTypeChange={(val) => handleTypeChange(record.id, val)}
              onCreateUpdate={() => handleCreateUpdate(record.id)}
              onExpandNote={(update) =>
                setExpandedNote({ projectId: record.id, update })
              }
              userName={userName}
              updateOwnerId={updateOwnerId}
            />
          ))
        )}
      </div>

      {expandedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 transition-all">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative animate-fadeIn">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={() => setExpandedNote(null)}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-lg font-bold mb-3">Update Details</h3>
            <UpdateDisplay
              update={expandedNote.update}
              userName={userName}
              expanded
            />
          </div>
        </div>
      )}
    </div>
  );
}