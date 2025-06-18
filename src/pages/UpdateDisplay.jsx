import React, { useState } from "react";

// "expanded" prop is used for modal display
export default function UpdateDisplay({ update, userName, onExpand, expanded }) {
  const [isHovered, setIsHovered] = useState(false);

  if (!update) return null;
  const { fields } = update;
  const dateStr = new Date(fields.Date).toLocaleDateString();

  return (
    <div
      className={`relative group transition-all ${
        expanded
          ? "bg-white p-4 border-2 border-blue-600 shadow-2xl z-50"
          : "bg-blue-50 border border-blue-200 p-3 rounded cursor-pointer hover:shadow-lg"
      }`}
      style={expanded ? { minHeight: 200 } : { maxHeight: 120, overflow: "hidden" }}
      onClick={() => !expanded && onExpand && onExpand()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={!expanded ? "Click to expand" : ""}
    >
      <div className="font-medium mb-1 text-blue-800 flex items-center">
        <span>{fields["Update Type"]}</span>
      </div>
      <div
        className={`text-gray-700 whitespace-pre-line transition-all ${
          expanded ? "text-base" : "line-clamp-3"
        }`}
      >
        {fields.Notes}
      </div>
      <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
        <span>{dateStr}</span>
        <span>•</span>
        <span>{userName}</span>
      </div>
      {fields.Attachments?.length > 0 && (
        <div className="mt-2">
          <div className="text-xs font-semibold mb-1">Attachments:</div>
          <ul className="list-disc list-inside">
            {fields.Attachments.map((att, i) => (
              <li key={i}>
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {att.filename || att.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!expanded && (
        <div className="absolute inset-0 bg-blue-100 bg-opacity-0 group-hover:bg-opacity-30 transition pointer-events-none" />
      )}
    </div>
  );
}
