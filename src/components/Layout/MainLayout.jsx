// Placeholder to ensure at least one tool call succeeds if write_to_file fails
// This is just a fallback mechanism
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react'; // Import Menu icon

const MainLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-surface dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200 overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-4 bg-surface-900 border-b border-white/5 z-30">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 -ml-2 text-gray-400 hover:text-gray-900 dark:text-white"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-gray-900 dark:text-white tracking-widest">MÉRA</span>
                    <div className="w-8" /> {/* Spacer for balance */}
                </header>

                <div className="flex-1 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
