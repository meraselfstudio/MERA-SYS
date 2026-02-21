import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Absensi from './pages/Absensi';
import Finance from './pages/Finance';
import Settings from './pages/Settings';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import LockScreen from './components/Auth/LockScreen';
import ErrorBoundary from './components/ErrorBoundary';

const NotFound = () => (
    <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-800 dark:text-gray-200">404</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mt-4">Page Not Found</p>
            <a href="/" className="mt-6 inline-block bg-primary text-white px-6 py-2 rounded hover:bg-primary-dark transition-colors">
                Back to Dashboard
            </a>
        </div>
    </div>
);

import { FinanceProvider } from './context/FinanceContext';

const AppRoutes = () => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return (
            <ErrorBoundary>
                <LockScreen />
            </ErrorBoundary>
        );
    }

    return (
        <MainLayout>
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/pos" element={<POS />} />
                {/* Absensi Route Removed - Use LockScreen */}
                <Route path="/finance" element={<Finance />} />
                <Route path="/absensi" element={<Absensi />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </MainLayout>
    );
};

function App() {
    return (
        <AuthProvider>
            <FinanceProvider>
                <ThemeProvider>
                    <Router>
                        <AppRoutes />
                    </Router>
                </ThemeProvider>
            </FinanceProvider>
        </AuthProvider>
    );
}

export default App;
