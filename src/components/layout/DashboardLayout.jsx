// src/components/layout/DashboardLayout.jsx
import { Outlet } from "react-router-dom";
import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function DashboardLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar /> {/* Fixed at the top */}
      
      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10"> {/* Content area padding and max-width */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 min-h-[calc(100vh-10rem)]"> 
            {/* 
              min-h calculation is approximate: 
              10rem ~ 160px (rough estimate for navbar + footer + main padding Y).
              This ensures the white card takes up significant space even if content is short.
              The `flex-1` on main handles the overall stretching.
            */}
            <React.Suspense fallback={<div className="text-center py-20 text-lg text-gray-500">Loading page content...</div>}>
              <Outlet />
            </React.Suspense>
          </div>
        </div>
      </main>
      
      <Footer /> {/* Fixed at the bottom */}
    </div>
  );
}