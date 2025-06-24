import React from 'react';

// A simple helper to format the date nicely
function formatDate(dateString) {
  if (!dateString) return "No date";
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function UpdateDisplay({ update, userName }) {
  // Destructure directly from the 'update' object
  const { notes, update_type: updateType, date } = update;

  const formattedDate = formatDate(date);

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex justify-between items-start">
        <p className="text-gray-800 text-sm whitespace-pre-wrap flex-1">{notes || "No notes for this update."}</p>
        <div className="ml-4 text-right flex-shrink-0">
          <span className="text-xs font-bold uppercase tracking-wider text-white bg-gray-400 px-2 py-1 rounded-full">
            {updateType || "Update"}
          </span>
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200 flex justify-between">
        <span>By: <span className="font-semibold">{userName}</span></span>
        <span>{formattedDate}</span>
      </div>
    </div>
  );
}