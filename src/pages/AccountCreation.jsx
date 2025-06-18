import React, { useState } from "react";
import { createAccount, updateUser } from "../api/airtable";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const ACCOUNT_TYPE_OPTIONS = [
  "Channel Partner",
  "Client",
  "Vendor",
  "Technology Partner",
  "Internal Initiative", 
];

export default function AccountCreation() {
  const [fields, setFields] = useState({
    "Account Name": "",
    "Account Type": "",
    "Account Description": "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Get current user info from localStorage
  const accountOwnerId = localStorage.getItem("userRecordId") || "";
  const ownerId = localStorage.getItem("owner_id") || "1";
  const userName = localStorage.getItem("userName") || "Current User";

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      // 1. Create the account
      const account = await createAccount({
        "Account Name": fields["Account Name"],
        "Account Type": fields["Account Type"],
        "Account Description": fields["Account Description"],
        "Account Owner": accountOwnerId ? [accountOwnerId] : [],
        "owner_id": Number(ownerId),
      });

      // 2. Update the user's Accounts field to include this account
      if (account && account.id && accountOwnerId) {
        // Get current accounts from localStorage (if any)
        const prevAccounts = JSON.parse(localStorage.getItem("accountIds") || "[]");
        const updatedAccounts = [...new Set([...prevAccounts, account.id])];
        // Update in Airtable
        await updateUser(accountOwnerId, { "Accounts": updatedAccounts });
        // Update in localStorage for immediate UI sync
        localStorage.setItem("accountIds", JSON.stringify(updatedAccounts));
      }

      setFields({
        "Account Name": "",
        "Account Type": "",
        "Account Description": "",
      });
      setSuccess(true);
    } catch (err) {
      setError("Failed to create account.");
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
            Create New Account
          </h2>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-center font-medium">
              Account created successfully!
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-base text-gray-700 font-medium mb-1">
              Account Name
            </label>
            <input
              required
              placeholder="Start typing..."
              className="border border-gray-200 rounded-lg px-4 py-3 text-lg bg-white focus:outline-none focus:border-blue-400 transition"
              value={fields["Account Name"]}
              onChange={e =>
                setFields(f => ({ ...f, "Account Name": e.target.value }))
              }
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-base text-gray-700 font-medium mb-1">
              Account Owner
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
              Account Type
            </label>
            <select
              required
              className="border border-gray-200 rounded-lg px-4 py-3 text-lg bg-white focus:outline-none focus:border-blue-400 transition"
              value={fields["Account Type"]}
              onChange={e =>
                setFields(f => ({ ...f, "Account Type": e.target.value }))
              }
            >
              <option value="" disabled>
                Select account type
              </option>
              {ACCOUNT_TYPE_OPTIONS.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-base text-gray-700 font-medium mb-1">
              Account Description
            </label>
            <textarea
              placeholder="Add a description..."
              className="border border-gray-200 rounded-lg px-4 py-3 text-lg bg-white focus:outline-none focus:border-blue-400 transition min-h-[90px]"
              value={fields["Account Description"]}
              onChange={e =>
                setFields(f => ({ ...f, "Account Description": e.target.value }))
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
              {loading ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
 
    </>
  );
}
