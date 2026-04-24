"use client";

import React from 'react';
import DashboardNav from '@/components/DashboardNav';
import { useAuth } from '@/contexts/AuthContext';
import { User, CreditCard, Bell, Shield, Trash2 } from 'lucide-react';

export default function SettingsPage() {
    const { user } = useAuth();

    return (
        <>
            <DashboardNav />
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
                    </div>

                    {/* Account Information */}
                    <div className="bg-white rounded-lg shadow mb-6">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center">
                                <User className="w-5 h-5 text-gray-400 mr-2" />
                                <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
                            </div>
                        </div>
                        <div className="px-6 py-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                    <input
                                        type="text"
                                        value={user?.firstName || ''}
                                        disabled
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        value={user?.lastName || ''}
                                        disabled
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                <input
                                    type="text"
                                    value={user?.companyName || 'Not provided'}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Subscription */}
                    <div className="bg-white rounded-lg shadow mb-6">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center">
                                <CreditCard className="w-5 h-5 text-gray-400 mr-2" />
                                <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>
                            </div>
                        </div>
                        <div className="px-6 py-4">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Current Plan</p>
                                    <p className="text-2xl font-bold text-gray-900 capitalize">{user?.planType || 'Free'}</p>
                                </div>
                                <a
                                    href="/pricing"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Upgrade Plan
                                </a>
                            </div>
                            {user?.planType !== 'free' && (
                                <div className="border-t pt-4">
                                    <button className="text-sm text-blue-600 hover:text-blue-700">
                                        Manage Subscription
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="bg-white rounded-lg shadow mb-6">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center">
                                <Bell className="w-5 h-5 text-gray-400 mr-2" />
                                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                            </div>
                        </div>
                        <div className="px-6 py-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                                    <p className="text-sm text-gray-500">Receive updates about your searches and exports</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Marketing Emails</p>
                                    <p className="text-sm text-gray-500">Receive tips and product updates</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Security */}
                    <div className="bg-white rounded-lg shadow mb-6">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center">
                                <Shield className="w-5 h-5 text-gray-400 mr-2" />
                                <h2 className="text-lg font-semibold text-gray-900">Security</h2>
                            </div>
                        </div>
                        <div className="px-6 py-4 space-y-4">
                            <div>
                                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                    Change Password
                                </button>
                            </div>
                            <div>
                                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                    Enable Two-Factor Authentication
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-white rounded-lg shadow border-2 border-red-200">
                        <div className="px-6 py-4 border-b border-red-200 bg-red-50">
                            <div className="flex items-center">
                                <Trash2 className="w-5 h-5 text-red-600 mr-2" />
                                <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
                            </div>
                        </div>
                        <div className="px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Delete Account</p>
                                    <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
                                </div>
                                <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors">
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
