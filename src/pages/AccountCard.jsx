import React from "react";
import { Link } from "react-router-dom";
import { Building2, ArrowRight } from "lucide-react";

export default function AccountCard({ record, onCreateProject }) {
  // Extract data from record with fallbacks
  const accountName = record.fields["Account Name"] || "Unnamed Account";
  const accountType = record.fields["Account Type"] || "No Type";
  const accountDescription = record.fields["Account Description"] || "";
  const accountValue = record.fields["Account Value"] || "N/A";
  const accountStatus = record.fields["Status"] || "Active";

  // Function to determine badge color based on account type
  const getBadgeColor = (type) => {
    switch (type?.toLowerCase()) {
      case "customer":
        return "bg-green-100 text-green-700";
      case "partner":
        return "bg-blue-100 text-blue-700";
      case "prospect":
        return "bg-amber-100 text-amber-700";
      case "vendor":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const statusColor = accountStatus === "Active" ? "text-green-600" : "text-gray-500";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <Link
                to={`/accounts/${record.id}`}
                className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors"
              >
                {accountName}
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getBadgeColor(accountType)}`}>
                  {accountType}
                </span>
                <span className={`text-xs ${statusColor}`}>• {accountStatus}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={onCreateProject}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-400 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm"
          >
            + New Project
          </button>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          {accountDescription ? (
            accountDescription.length > 120 ? (
              `${accountDescription.substring(0, 120)}...`
            ) : (
              accountDescription
            )
          ) : (
            <span className="text-gray-400 italic">No description available</span>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
          <div className="flex gap-6">
            {record.fields["Projects"] && (
              <div>
                <span className="text-xs text-gray-500">Projects</span>
                <p className="font-semibold text-gray-800">{record.fields["Projects"].length || 0}</p>
              </div>
            )}
          </div>
          
          <Link 
            to={`/accounts/${record.id}`}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View Details
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}