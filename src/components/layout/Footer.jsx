// src/components/layout/Footer.jsx
import React from "react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <span className="text-sm text-gray-600 font-merriweather">
            Copyright © {new Date().getFullYear()} FTB Communications PVT LTD. All rights reserved.
          </span>
          <div className="flex items-center space-x-6 text-sm text-gray-600 font-open-sans">
            <a href="#" className="hover:text-primary hover:underline">Help</a>
            <a href="#" className="hover:text-primary hover:underline">Privacy</a>
            <a href="#" className="hover:text-primary hover:underline">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}