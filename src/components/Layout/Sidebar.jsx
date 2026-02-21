import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MeraLogo } from '../Logo';
import {
    ChevronLeft,
    ChevronRight,
    LogOut,
    LayoutDashboard,
    ShoppingCart,
    Wallet
} from '../Icons';
import { Settings as SettingsIcon, UserCheck } from 'lucide-react';
import clsx from 'clsx';

import ShiftSummary from '../Auth/ShiftSummary'; // Import ShiftSummary

import { useAuth } from '../../context/AuthContext'; // Import useAuth context

const Sidebar = ({ isOpen, onClose }) => {
    const location = useLocation();
    const { user } = useAuth(); // Removed logout here, handled in ShiftSummary
    const [collapsed, setCollapsed] = useState(false);
    const [showShiftSummary, setShowShiftSummary] = useState(false); // State for modal

    // Auto-close sidebar on mobile when route changes
    React.useEffect(() => {
        if (window.innerWidth < 768 && onClose) {
            onClose();
        }
    }, [location.pathname, onClose]);

    // Indonesian Labels, Solid Style
    const navItems = [
        { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'DASHBOARD' },
        { to: '/pos', icon: <ShoppingCart size={20} />, label: 'POS' },
        { to: '/finance', icon: <Wallet size={20} />, label: 'FINANCE' },
        { to: '/absensi', icon: <UserCheck size={20} />, label: 'CREW LOGIN' },
        { to: '/settings', icon: <SettingsIcon size={20} />, label: 'SETTINGS' },
    ];

    return (
        <>
            <aside
                className={clsx(
                    "fixed inset-y-0 left-0 z-50 transition-all duration-300 flex flex-col backdrop-blur-md",
                    "bg-surface-950/95 border-r border-white/5 md:border-r-0",
                    "md:relative md:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                    collapsed ? "md:w-24 w-64" : "w-64 md:w-80"
                )}
            >
                {/* Header / Logo */}
                <div className={`h-32 flex items-center justify-center border-b border-white/5 p-6 transition-all duration-500 ${collapsed ? 'h-24 p-2' : ''}`}>
                    <div className={`transition-transform duration-500 ${collapsed ? 'scale-75' : 'scale-110'}`}>
                        <MeraLogo className="h-full w-auto max-h-20" />
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 space-y-1 px-3 scrollbar-hide">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => clsx(
                                "flex items-center px-4 py-3 rounded-xl transition-all duration-300 group border relative overflow-hidden",
                                "font-bold tracking-wide text-sm uppercase",
                                isActive
                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/30 scale-[1.02]"
                                    : "bg-transparent text-gray-400 border-transparent hover:border-white/10 hover:text-white hover:bg-white/5",
                                collapsed ? "justify-center" : "gap-4"
                            )}
                        >

                            <span className={clsx("truncate relative z-10 transition-all duration-300", collapsed ? "text-lg font-black" : "text-sm")}>
                                {collapsed ? item.label.charAt(0) : item.label}
                            </span>

                            {/* Playful Hover Effect Background */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer z-0 pointer-events-none" />
                        </NavLink>
                    ))}
                </nav>

                {/* User Profile / Footer */}
                <div className="p-6 border-t border-red-950/30 bg-surface-950 relative group/footer">

                    {/* Collapse Toggle */}
                    {!collapsed && (
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="absolute -top-3 left-6 p-1 rounded-full border border-white/20 bg-white/10 text-gray-900 dark:text-white hover:bg-white hover:text-red-900 transition-all shadow-lg backdrop-blur-sm z-20"
                            title="Collapse"
                        >
                            <ChevronLeft size={14} />
                        </button>
                    )}
                    {collapsed && (
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="absolute -top-3 left-1/2 -translate-x-1/2 p-1 rounded-full border border-white/20 bg-white/10 text-gray-900 dark:text-white hover:bg-white hover:text-red-900 transition-all shadow-lg backdrop-blur-sm z-20"
                            title="Expand"
                        >
                            <ChevronRight size={14} />
                        </button>
                    )}

                    <div className={clsx("flex items-center transition-all duration-300", collapsed ? "justify-center flex-col gap-4" : "justify-between gap-3")}>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-500 p-[2px] shadow-lg shadow-primary/20 shrink-0">
                                <div className="w-full h-full rounded-full bg-surface-900 flex items-center justify-center text-gray-900 dark:text-white font-black text-xs uppercase">
                                    {user?.name?.substring(0, 2) || 'GS'} {/* Initials */}
                                </div>
                            </div>
                            {!collapsed && (
                                <div className="min-w-0 transition-opacity duration-300">
                                    <p className="text-base font-black text-gray-900 dark:text-white truncate group-hover/footer:text-primary transition-colors">{user?.name || 'Guest'}</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.role || 'Visitor'}</p>
                                </div>
                            )}
                        </div>

                        {!collapsed && (
                            <button
                                onClick={() => setShowShiftSummary(true)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-gray-400 hover:text-white hover:bg-red-600 border border-white/8 hover:border-red-600 transition-all duration-200 group/logout"
                                title="Keluar"
                            >
                                <LogOut size={16} className="group-hover/logout:scale-110 transition-transform" />
                                <span>Keluar</span>
                            </button>
                        )}
                    </div>
                </div>
            </aside>

            {/* Shift Summary Modal */}
            {showShiftSummary && <ShiftSummary onClose={() => setShowShiftSummary(false)} />}
        </>
    );
};

export default Sidebar;

