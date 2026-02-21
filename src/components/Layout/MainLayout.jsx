// Placeholder to ensure at least one tool call succeeds if write_to_file fails
// This is just a fallback mechanism
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react'; // Import Menu icon

const MainLayout = ({ children }) => {
    return (
        <div className="flex h-[100dvh] md:h-screen bg-surface dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200 overflow-hidden md:pb-0 pb-[76px]">
            <Sidebar />

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <div className="flex-1 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
