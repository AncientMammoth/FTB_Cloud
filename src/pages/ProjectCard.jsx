import React from "react";
import { Link } from "react-router-dom";
import UpdateForm from "./UpdateForm";
import UpdateDisplay from "./UpdateDisplay";

export default function ProjectCard({
  record,
  update,
  notes,
  updateType,
  updateTypeOptions,
  error,
  onNotesChange,
  onTypeChange,
  onCreateUpdate,
  onExpandNote,
  userName,
}) {
  const projectId = record.id;
  const account = record.fields.Account?.[0];
  const accountName = record.fields["Account Name (from Account)"]?.[0] || "N/A";

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="w-full sm:w-1/4 min-w-[180px] max-w-[240px]">
          <Link
            to={`/projects/${projectId}`}
            className="font-semibold hover:text-blue-600"
          >
            {record.fields["Project Name"] || "Unnamed Project"}
          </Link>
          <div className="mt-2 text-sm space-y-1">
            <p>
              Status:{" "}
              <span className="text-gray-700">
                {record.fields["Project Status"] || "N/A"}
              </span>
            </p>
            <p>
              Account:{" "}
              {account ? (
                <Link
                  to={`/accounts/${account}`}
                  className="text-blue-600 hover:underline"
                >
                  {accountName}
                </Link>
              ) : (
                "N/A"
              )}
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-row items-start gap-3 w-full">
          <div className="flex-1 min-w-[200px] max-w-full">
            {update ? (
              <UpdateDisplay
                update={update}
                userName={userName}
                onExpand={() => onExpandNote(update)}
              />
            ) : (
              <UpdateForm
                notes={notes}
                updateType={updateType}
                onNotesChange={onNotesChange}
                onTypeChange={onTypeChange}
                onSubmit={onCreateUpdate}
                error={error}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}