'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, ExternalLink, Mail, MapPin, Phone, Star, Copy, X } from 'lucide-react';

interface SavedBusiness {
    id: string;
    name: string;
    category: string;
    address: string;
    phone?: string;
    rating?: number;
    reviews_count?: number;
    website_url?: string;
    savedAt: string;
}

export default function SavedBusinessesPage() {
    const [savedBusinesses, setSavedBusinesses] = useState<SavedBusiness[]>([]);
    const [loading, setLoading] = useState(true);
    const [generatingCopy, setGeneratingCopy] = useState<string | null>(null);
    const [generatedCopy, setGeneratedCopy] = useState<string | null>(null);
    const [selectedBusinessForCopy, setSelectedBusinessForCopy] = useState<SavedBusiness | null>(null);

    useEffect(() => {
        fetchSavedBusinesses();
    }, []);

    const fetchSavedBusinesses = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/saved-businesses');
            const data = await response.json();
            if (data.success) {
                setSavedBusinesses(data.data);
            }
        } catch (error) {
            console.error('Error fetching saved businesses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (id: string) => {
        try {
            await fetch(`http://localhost:3001/api/saved-businesses/${id}`, {
                method: 'DELETE',
            });
            setSavedBusinesses(prev => prev.filter(b => b.id !== id));
        } catch (error) {
            console.error('Error removing business:', error);
        }
    };

    const handleGenerateCopy = async (business: SavedBusiness) => {
        setGeneratingCopy(business.id);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/ai/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${token}` // TODO: Add auth token
                },
                body: JSON.stringify({ business })
            });

            const data = await response.json();

            if (data.success) {
                setGeneratedCopy(data.content);
                setSelectedBusinessForCopy(business);
            } else {
                alert('Failed to generate copy: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error generating copy:', error);
            alert('Error generating copy');
        } finally {
            setGeneratingCopy(null);
        }
    };

    const copyToClipboard = () => {
        if (generatedCopy) {
            navigator.clipboard.writeText(generatedCopy);
            alert('Copied to clipboard!');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Saved Businesses</h1>
                        <p className="text-gray-600 mt-1">Manage your saved leads and generate outreach copy</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                        <span className="font-medium text-gray-900">{savedBusinesses.length}</span>
                        <span className="text-gray-500 ml-1">saved leads</span>
                    </div>
                </div>

                {savedBusinesses.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                            <Star className="w-full h-full" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No saved businesses yet</h3>
                        <p className="mt-2 text-gray-500">Search for businesses and save them to see them here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {savedBusinesses.map((business) => (
                            <div key={business.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{business.name}</h3>
                                            <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full mt-1">
                                                {business.category}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleRemove(business.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                            title="Remove from saved"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="space-y-3 text-sm text-gray-600 mb-6">
                                        <div className="flex items-start">
                                            <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                            <span className="line-clamp-2">{business.address}</span>
                                        </div>
                                        {business.phone && (
                                            <div className="flex items-center">
                                                <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                                                <span>{business.phone}</span>
                                            </div>
                                        )}
                                        {business.rating && (
                                            <div className="flex items-center">
                                                <Star className="w-4 h-4 mr-2 text-yellow-400 flex-shrink-0" />
                                                <span>{business.rating} ({business.reviews_count} reviews)</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => handleGenerateCopy(business)}
                                            disabled={generatingCopy === business.id}
                                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center text-sm font-medium disabled:opacity-50"
                                        >
                                            {generatingCopy === business.id ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            ) : (
                                                <Mail className="w-4 h-4 mr-2" />
                                            )}
                                            {generatingCopy === business.id ? 'Generating...' : 'Generate Copy'}
                                        </button>
                                        {business.website_url && (
                                            <a
                                                href={business.website_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-600 transition-colors"
                                                title="Visit website"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500">
                                    Saved {new Date(business.savedAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* AI Copy Modal */}
            {generatedCopy && selectedBusinessForCopy && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-xl font-semibold text-gray-900">
                                Outreach Email for {selectedBusinessForCopy.name}
                            </h3>
                            <button
                                onClick={() => setGeneratedCopy(null)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap font-mono text-sm text-gray-800">
                                {generatedCopy}
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                                onClick={() => setGeneratedCopy(null)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Close
                            </button>
                            <button
                                onClick={copyToClipboard}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                            >
                                <Copy className="w-4 h-4 mr-2" />
                                Copy to Clipboard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
