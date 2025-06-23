import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchTasksByIds } from '../api';
import {
    BuildingOffice2Icon,
    BriefcaseIcon,
    DocumentTextIcon,
    ArrowTopRightOnSquareIcon,
    ListBulletIcon,
    CalendarDaysIcon
} from '@heroicons/react/24/outline';

const STATUS_COLORS = {
    "To Do": "bg-gray-200 text-gray-800",
    "In Progress": "bg-blue-200 text-blue-800",
    "Blocked": "bg-red-200 text-red-800",
};

export default function Home() {
    const userName = localStorage.getItem("userName") || "User";
    const accountIds = JSON.parse(localStorage.getItem("accountIds") || "[]");
    const projectIds = JSON.parse(localStorage.getItem("projectIds") || "[]");
    const updateIds = JSON.parse(localStorage.getItem("updateIds") || "[]");
    const taskIds = useMemo(() => JSON.parse(localStorage.getItem("taskIds") || "[]"), []);

    const summaryStats = [
        { title: 'Managed Accounts', count: accountIds.length, link: '/accounts', Icon: BuildingOffice2Icon },
        { title: 'Active Projects', count: projectIds.length, link: '/projects', Icon: BriefcaseIcon },
        { title: 'Recent Updates', count: updateIds.length, link: '/updates', Icon: DocumentTextIcon },
    ];

    const { data: allTasks = [], isLoading: tasksLoading } = useQuery({
        queryKey: ['homePageTasks', taskIds],
        queryFn: () => fetchTasksByIds(taskIds),
        enabled: taskIds.length > 0,
    });

    const upcomingTasks = useMemo(() => {
        if (!allTasks) return [];
        return allTasks
            .filter(task => task.fields.Status !== 'Done')
            .sort((a, b) => new Date(a.fields['Due Date']) - new Date(b.fields['Due Date']))
            .slice(0, 5);
    }, [allTasks]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <main className="space-y-16">
                {/* Section 1: Welcome Header */}
                <header>
                    <h1 className="text-4xl font-bold text-gray-800">Welcome back, {userName}!</h1>
                    <p className="mt-2 text-lg text-gray-500">Here's a snapshot of your workspace and upcoming tasks.</p>
                </header>

                {/* Section 2: Quick Actions (Moved Up) */}
                <section aria-labelledby="actions-heading">
                    <h2 id="actions-heading" className="text-2xl font-semibold text-gray-800 mb-5">Quick Actions</h2>
                    <div className="flex flex-wrap gap-4">
                        <Link to="/create-account" className="px-5 py-2 text-white bg-gray-500 rounded-lg font-medium shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors">
                            + New Account
                        </Link>
                        <Link to="/create-project" className="px-5 py-2 text-white bg-gray-500 rounded-lg font-medium shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors">
                            + New Project
                        </Link>
                        <Link to="/create-update" className="px-5 py-2 text-white bg-gray-500 rounded-lg font-medium shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors">
                            + New Update
                        </Link>
                        <Link to="/create-task" className="px-5 py-2 text-white bg-gray-500 rounded-lg font-medium shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors">
                            + New Task
                        </Link>
                    </div>
                </section>

                {/* Section 3: Upcoming Tasks (Moved Up) */}
                <section aria-labelledby="tasks-heading">
                    <div className="flex items-center justify-between mb-5">
                        <h2 id="tasks-heading" className="text-2xl font-semibold text-gray-800 flex items-center">
                            <ListBulletIcon className="h-6 w-6 mr-3 text-primary" />
                            Your Upcoming Tasks
                        </h2>
                        <Link to="/my-tasks" className="text-sm font-medium text-primary hover:underline">
                            View All Tasks &rarr;
                        </Link>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        {tasksLoading ? (
                            <p className="text-center text-gray-500 p-12">Loading tasks...</p>
                        ) : upcomingTasks.length > 0 ? (
                            <ul className="divide-y divide-gray-200">
                                {upcomingTasks.map((task) => (
                                    <li key={task.id} className="p-5 hover:bg-gray-50 transition-colors duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex-1 mb-3 sm:mb-0">
                                            <p className="font-semibold text-gray-800">{task.fields["Task Name"]}</p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Project: <Link to={`/projects/${task.fields.Project[0]}`} className="hover:underline">{task.fields["Project Name"]?.[0] || 'N/A'}</Link>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
                                            <div className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[task.fields.Status]}`}>
                                                {task.fields.Status}
                                            </div>
                                            <div className="flex items-center text-sm text-red-600 font-semibold">
                                                <CalendarDaysIcon className="h-4 w-4 mr-1.5" />
                                                Due: {new Date(task.fields["Due Date"]).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center text-gray-500 p-12">
                                <h3 className="font-semibold text-lg">All caught up!</h3>
                                <p className="mt-1">You have no upcoming tasks. Great job!</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Section 4: Summary Stat Cards (Moved to the End) */}
                <section aria-labelledby="summary-heading">
                    <h2 id="summary-heading" className="sr-only">Summary Statistics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {summaryStats.map((stat) => (
                            <div
                                key={stat.title}
                                className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                            >
                                <div>
                                    <stat.Icon className="h-8 w-8 text-primary mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-600">{stat.title}</h3>
                                    <p className="text-5xl font-bold text-gray-800 my-2">{stat.count}</p>
                                </div>
                                <Link to={stat.link} className="mt-4 text-sm font-medium text-primary hover:underline flex items-center">
                                    View {stat.title}
                                    <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1.5" />
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}