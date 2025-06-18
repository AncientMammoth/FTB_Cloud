import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAccountsByIds } from "../api/airtable";
import AccountCard from "./AccountCard";
import SearchAndFilterBar from "./SearchAndFilterBar";
import QuickCreateProject from "./QuickCreateProject";

export default function Accounts() {
  const accountIds = useMemo(() => JSON.parse(localStorage.getItem("accountIds") || "[]"), []);
  const { data: accounts = [], isLoading, error } = useQuery({
    queryKey: ["accounts", accountIds],
    queryFn: () => fetchAccountsByIds(accountIds),
    enabled: accountIds.length > 0,
    onError: (err) => {
      console.error("[Accounts] Error fetching accounts:", err);
    },
  });

  // State management
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Extract all unique account types for filter dropdown
  const accountTypeOptions = useMemo(() => {
    const types = new Set();
    accounts.forEach((acc) => {
      const t = acc.fields["Account Type"];
      if (t) types.add(t);
    });
    return Array.from(types);
  }, [accounts]);

  // Filter accounts based on search and type filter
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const name = acc.fields["Account Name"]?.toLowerCase() || "";
      const type = acc.fields["Account Type"]?.toLowerCase() || "";
      const matchesSearch = name.includes(search.toLowerCase()) || 
                          type.includes(search.toLowerCase());
      const matchesType = typeFilter ? acc.fields["Account Type"] === typeFilter : true;
      return matchesSearch && matchesType;
    });
  }, [accounts, search, typeFilter]);

  // Handle "Create Project" button click from AccountCard
  const handleCreateProject = (account) => {
    setSelectedAccount(account);
    setShowProjectModal(true);
  };
  
  // Handle closing the modal
  const handleCloseModal = () => {
    setShowProjectModal(false);
    setSelectedAccount(null);
  };

  // Loading and error states
  if (isLoading) return (
    <div className="flex items-center justify-center py-20 text-gray-400">
      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Loading accounts...
    </div>
  );
  
  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mt-4">
      <p className="font-medium">Error loading accounts</p>
      <p className="text-sm mt-1">{error.message}</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">My Managed Accounts</h1>
          <p className="text-gray-500 mt-1">Manage your customer accounts and create projects</p>
        </div>
        <button 
          className="px-5 py-2 text-white bg-gray-500 rounded-lg font-medium shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          onClick={() => setShowProjectModal(true)}
        >
          + Create Project
        </button>
      </div>

      {/* Search and filter */}
      <SearchAndFilterBar
        search={search}
        setSearch={setSearch}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        accountTypeOptions={accountTypeOptions}
      />

      {/* Accounts list */}
      {filteredAccounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg py-16 px-4 text-center border border-gray-200">
          <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No accounts found</h3>
          <p className="text-gray-500 max-w-md">
            {search || typeFilter 
              ? "Try adjusting your search or filter criteria to find what you're looking for." 
              : "You don't have any accounts yet. Create your first account to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredAccounts.map((account) => (
            <AccountCard
              key={account.id}
              record={account}
              onCreateProject={() => handleCreateProject(account)}
            />
          ))}
        </div>
      )}

      {/* Project creation modal */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
              onClick={handleCloseModal}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <h2 className="text-xl font-semibold mb-5">Create New Project</h2>
            <QuickCreateProject 
              accounts={accounts} 
              onClose={handleCloseModal}
              defaultAccount={selectedAccount}
            />
          </div>
        </div>
      )}
    </div>
  );
}