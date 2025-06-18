import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProject, updateUser } from "../api/airtable";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

const PROJECT_STATUS_OPTIONS = [
  "Need Analysis",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function QuickCreateProject({ accounts, onClose, defaultAccount }) {
  const queryClient = useQueryClient();

  // Set default account if provided
  const [fields, setFields] = useState({
    "Project Name": "",
    "Project Status": PROJECT_STATUS_OPTIONS[0],
    "Start Date": new Date().toISOString().split('T')[0],
    "End Date": "",
    "Account": defaultAccount?.id || "",
    "Project Value": "",
    "Project Description": "",
  });

  useEffect(() => {
    setFields(f => ({
      ...f,
      "Account": defaultAccount?.id || "",
    }));
  }, [defaultAccount]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const projectOwnerId = localStorage.getItem("userRecordId") || "";

  const createProjectMutation = useMutation({
    mutationFn: async (projectData) => {
      // 1. Create the project
      const project = await createProject(projectData);

      // 2. Update the user's Projects field to include this project
      if (project && project.id && projectOwnerId) {
        const prevProjects = JSON.parse(localStorage.getItem("projectIds") || "[]");
        const updatedProjects = [...new Set([...prevProjects, project.id])];
        await updateUser(projectOwnerId, { "Projects": updatedProjects });
        localStorage.setItem("projectIds", JSON.stringify(updatedProjects));
      }

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["projects"]);
      onClose();
    },
    onError: (err) => {
      setError("Failed to create project: " + (err.message || "Unknown error"));
      setLoading(false);
    }
  });

  async function handleSubmit(e) {
    e.preventDefault();

    if (!fields["Account"]) {
      setError("Please select an account");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createProjectMutation.mutateAsync({
        "Project Name": fields["Project Name"],
        "Project Status": fields["Project Status"],
        "Start Date": fields["Start Date"],
        "End Date": fields["End Date"],
        "Account": fields["Account"] ? [fields["Account"]] : [],
        "Project Value": fields["Project Value"] ? Number(fields["Project Value"]) : undefined,
        "Project Description": fields["Project Description"],
        "Project Owner": projectOwnerId ? [projectOwnerId] : [],
      });
    } catch (err) {
      setError("Failed to create project: " + (err.message || "Unknown error"));
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-6 relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <h2 className="text-xl font-semibold mb-5">Create New Project</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              placeholder="Enter project name"
              value={fields["Project Name"]}
              onChange={e => setFields(f => ({ ...f, "Project Name": e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Status</label>
            <Listbox value={fields["Project Status"]} onChange={value => setFields(f => ({ ...f, "Project Status": value }))}>
              {({ open }) => (
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <span className="block truncate">{fields["Project Status"]}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Transition
                    show={open}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-1 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60">
                      {PROJECT_STATUS_OPTIONS.map((status) => (
                        <Listbox.Option
                          key={status}
                          value={status}
                          className={({ active }) =>
                            classNames(
                              active ? "bg-blue-600 text-white" : "text-gray-900",
                              "cursor-default select-none relative py-2 pl-10 pr-4"
                            )
                          }
                        >
                          {({ selected, active }) => (
                            <>
                              <span
                                className={classNames(
                                  selected ? "font-medium" : "font-normal",
                                  "block truncate"
                                )}
                              >
                                {status}
                              </span>
                              {selected && (
                                <span
                                  className={classNames(
                                    active ? "text-white" : "text-blue-600",
                                    "absolute inset-y-0 left-0 flex items-center pl-3"
                                  )}
                                >
                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                required
                type="date"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                value={fields["Start Date"]}
                onChange={e => setFields(f => ({ ...f, "Start Date": e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                required
                type="date"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                value={fields["End Date"]}
                onChange={e => setFields(f => ({ ...f, "End Date": e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
            <Listbox value={fields["Account"]} onChange={value => setFields(f => ({ ...f, "Account": value }))}>
              {({ open }) => (
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <span className="block truncate">
                      {accounts.find(a => a.id === fields["Account"])?.fields["Account Name"] || "Select account"}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Transition
                    show={open}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-1 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60">
                      {accounts.map((acc) => (
                        <Listbox.Option
                          key={acc.id}
                          value={acc.id}
                          className={({ active }) =>
                            classNames(
                              active ? "bg-blue-600 text-white" : "text-gray-900",
                              "cursor-default select-none relative py-2 pl-10 pr-4"
                            )
                          }
                        >
                          {({ selected, active }) => (
                            <>
                              <span
                                className={classNames(
                                  selected ? "font-medium" : "font-normal",
                                  "block truncate"
                                )}
                              >
                                {acc.fields["Account Name"]}
                              </span>
                              {selected && (
                                <span
                                  className={classNames(
                                    active ? "text-white" : "text-blue-600",
                                    "absolute inset-y-0 left-0 flex items-center pl-3"
                                  )}
                                >
                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Value</label>
            <input
              type="number"
              min="0"
              placeholder="Enter project value"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              value={fields["Project Value"]}
              onChange={e => setFields(f => ({ ...f, "Project Value": e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Description</label>
            <textarea
              placeholder="Enter project description"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm min-h-[100px]"
              value={fields["Project Description"]}
              onChange={e => setFields(f => ({ ...f, "Project Description": e.target.value }))}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-2 text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
              loading 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
            }`}
          >
            {loading ? "Creating Project..." : "Create Project"}
          </button>
        </form>
      </div>
    </div>
  );
}
