"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    LayoutDashboard,
    Search,
    Bookmark,
    CreditCard,
    Settings,
    LogOut,
    Menu,
    X
} from 'lucide-react';

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Search', href: '/dashboard', icon: Search },
    { name: 'Saved Leads', href: '/saved', icon: Bookmark },
    { name: 'Pricing', href: '/pricing', icon: CreditCard },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardNav() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    return (
        <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/dashboard" className="flex items-center">
                            <span className="text-2xl font-bold text-blue-600">SiteScout</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon className="w-4 h-4 mr-2" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>

                    {/* User Menu */}
                    <div className="hidden md:flex items-center space-x-4">
                        {user && (
                            <div className="flex items-center space-x-3">
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">
                                        {user.firstName} {user.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">{user.planType} Plan</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            {mobileMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${isActive
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon className="w-5 h-5 mr-3" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                    {user && (
                        <div className="border-t px-4 py-3">
                            <div className="mb-3">
                                <p className="text-sm font-medium text-gray-900">
                                    {user.firstName} {user.lastName}
                                </p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                                <p className="text-xs text-gray-500 capitalize mt-1">{user.planType} Plan</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
}
