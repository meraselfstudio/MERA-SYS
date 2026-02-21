import React, { useState } from 'react';
import { Calendar, Clock, User, Phone, MoreHorizontal, Check, X, Search, Filter } from 'lucide-react';

const BookingModule = () => {
    // Mock Data
    const bookings = [
        { id: 'BK001', name: 'Putri', date: '2025-02-18', time: '14:00', package: 'Self Photo Session', status: 'PAID', pmt: 'QRIS' },
        { id: 'BK002', name: 'Dimas', date: '2025-02-18', time: '15:00', package: 'Party Photo Session', status: 'KEEPSLOT', pmt: 'PENDING' },
        { id: 'BK003', name: 'Sarah', date: '2025-02-18', time: '16:30', package: 'Thematic Basic', status: 'COMPLETED', pmt: 'CASH' },
        { id: 'BK004', name: 'Rini', date: '2025-02-19', time: '10:00', package: 'Self Photo Session', status: 'PAID', pmt: 'QRIS' },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'PAID': return 'bg-green-900/20 text-green-400 border border-green-900/50';
            case 'KEEPSLOT': return 'bg-yellow-900/20 text-yellow-400 border border-yellow-900/50';
            case 'COMPLETED': return 'bg-blue-900/20 text-blue-400 border border-blue-900/50';
            default: return 'bg-surface-800 text-gray-400 border border-white/10';
        }
    };

    return (
        <div className="p-6 h-full bg-background text-gray-900 dark:text-white">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Booking Management</h1>
                    <p className="text-gray-400 text-sm">Manage studio schedules and reservations</p>
                </div>
                <button className="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg shadow-primary/20">
                    + New Booking
                </button>
            </div>

            {/* Filters */}
            <div className="bg-surface-800 p-4 rounded-xl shadow-xl border border-white/10 mb-6 flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search customer name or booking ID..."
                        className="w-full pl-10 pr-4 py-2 bg-surface-900 border border-white/10 rounded-lg outline-none focus:border-primary text-gray-900 dark:text-white placeholder-gray-600 transition-colors"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 border border-white/10 rounded-lg flex items-center gap-2 hover:bg-surface-700 text-gray-300 hover:text-gray-900 dark:text-white transition-all">
                        <Calendar size={16} /> Date: Today
                    </button>
                    <button className="px-4 py-2 border border-white/10 rounded-lg flex items-center gap-2 hover:bg-surface-700 text-gray-300 hover:text-gray-900 dark:text-white transition-all">
                        <Filter size={16} /> Status: All
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-surface-800 rounded-xl shadow-xl border border-white/10 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-surface-900 border-b border-white/10">
                        <tr>
                            <th className="px-6 py-4 font-bold text-gray-400 text-sm uppercase tracking-wider">Booking Details</th>
                            <th className="px-6 py-4 font-bold text-gray-400 text-sm uppercase tracking-wider">Date & Time</th>
                            <th className="px-6 py-4 font-bold text-gray-400 text-sm uppercase tracking-wider">Package</th>
                            <th className="px-6 py-4 font-bold text-gray-400 text-sm uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 font-bold text-gray-400 text-sm uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-700">
                        {bookings.map((booking) => (
                            <tr key={booking.id} className="hover:bg-surface-700/50 group transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-surface-900 border border-white/10 flex items-center justify-center text-primary font-bold shadow-inner">
                                            {booking.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white">{booking.name}</div>
                                            <div className="text-xs text-gray-500 font-mono">{booking.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <Calendar size={14} className="text-primary" /> {booking.date}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-300 mt-1">
                                        <Clock size={14} className="text-primary" /> {booking.time}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-gray-300 font-medium">{booking.package}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(booking.status)}`}>
                                        {booking.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-2 hover:bg-surface-700 rounded-full text-gray-500 hover:text-gray-900 dark:text-white transition-colors">
                                        <MoreHorizontal size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BookingModule;
