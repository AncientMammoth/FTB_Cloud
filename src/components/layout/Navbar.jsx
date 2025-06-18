import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { UserCircleIcon, PlusIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/24/solid";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const userName = localStorage.getItem("userName") || "User";
  
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  // --- Re-introducing state and refs for a timer-based hover ---
  const [showMenu, setShowMenu] = React.useState(false);
  const [showTasksMenu, setShowTasksMenu] = React.useState(false);
  const menuTimer = React.useRef(null);
  const tasksMenuTimer = React.useRef(null);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // --- Handlers for the '+' menu ---
  const handleMenuEnter = () => {
    clearTimeout(menuTimer.current);
    setShowMenu(true);
  };
  const handleMenuLeave = () => {
    menuTimer.current = setTimeout(() => {
      setShowMenu(false);
    }, 250); // 250ms grace period
  };

  // --- Handlers for the 'Tasks' menu ---
  const handleTasksMenuEnter = () => {
    clearTimeout(tasksMenuTimer.current);
    setShowTasksMenu(true);
  };
  const handleTasksMenuLeave = () => {
    tasksMenuTimer.current = setTimeout(() => {
      setShowTasksMenu(false);
    }, 250); // 250ms grace period
  };


  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <img
              src="/assets/logo.png"
              alt="Logo"
              className="w-12 h-12 mt-2 object-contain rounded"
            />
            <Link to="/" className="text-2xl font-bold text-primary tracking-tight font-merriweather">
              Key Accounts Management
            </Link>
          </div>
          {/* Navigation Links */}
          {!isLoginPage && (
            <nav className="hidden md:flex space-x-8 text-sm font-medium font-open-sans">
              <Link to="/" className="text-gray-700 hover:text-primary transition-colors duration-150">Home</Link>
              <Link to="/accounts" className="text-gray-700 hover:text-primary transition-colors duration-150">Accounts</Link>
              <Link to="/projects" className="text-gray-700 hover:text-primary transition-colors duration-150">Projects</Link>
              <Link to="/updates" className="text-gray-700 hover:text-primary transition-colors duration-150">Updates</Link>
              
              <div className="relative flex items-center" onMouseEnter={handleTasksMenuEnter} onMouseLeave={handleTasksMenuLeave}>
                <button className="flex items-center text-gray-700 hover:text-primary transition-colors duration-150">
                  Tasks
                  <ChevronDownIcon className="h-4 w-4 ml-1" />
                </button>
                {showTasksMenu && (
                  <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-40 py-2">
                    <Link
                      to="/tasks"
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      View Assigned Tasks
                    </Link>
                    <Link
                      to="/my-tasks"
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      My Tasks
                    </Link>
                    <div className="border-t my-1 border-gray-100"></div>
                    <Link
                      to="/create-task"
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      + Create New Task
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          )}
          {/* Right Side: Quick Create, User Name, User Menu */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {!isLoginPage && (
              <div className="relative" onMouseEnter={handleMenuEnter} onMouseLeave={handleMenuLeave}>
                <button
                  className="p-1.5 sm:p-2 rounded-full text-primary hover:bg-gray-100 transition-colors duration-150"
                  title="Quick Create"
                >
                  <PlusIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-40 py-2">
                    <Link
                      to="/create-account"
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      + New Account
                    </Link>
                    <Link
                      to="/create-project"
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      + New Project
                    </Link>
                    <Link
                      to="/create-update"
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      + New Update
                    </Link>
                    <Link
                        to="/create-task"
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                        + New Task
                    </Link>
                  </div>
                )}
              </div>
            )}
            {/* User Name or Login */}
            <span className="hidden sm:inline-block text-gray-700 font-semibold font-open-sans px-2">
              {isLoginPage ? (
                <span className="text-primary font-bold">Login</span>
              ) : (
                userName
              )}
            </span>
            {/* User Menu (uses CSS group-hover, which is fine for this simple menu) */}
            {!isLoginPage && (
              <div className="relative group">
                <UserCircleIcon className="h-7 w-7 sm:h-8 sm:w-8 text-gray-500 cursor-pointer hover:text-primary transition-colors duration-150" />
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20 py-1">
                  <Link
                    to="/profile"
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary"
                  >
                    My Profile
                  </Link>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary"
                    onClick={handleLogout}
                  >
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}