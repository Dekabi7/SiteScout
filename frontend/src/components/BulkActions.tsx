import React from 'react';

interface BulkActionsProps {
  selectedCount: number;
  totalCount: number;
  onSave: () => void;
  onGenerateCopy: () => void;
}

export default function BulkActions({
  selectedCount,
  totalCount,
  onSave,
  onGenerateCopy
}: BulkActionsProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {selectedCount} of {totalCount} leads selected
          </span>
          <div className="h-4 w-px bg-gray-300"></div>
          <span className="text-sm text-gray-500">
            {Math.round((selectedCount / totalCount) * 100)}% selected
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onSave}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Save to List
          </button>

          <button
            onClick={onGenerateCopy}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Generate Copy
          </button>
        </div>
      </div>

      {selectedCount > 200 && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-yellow-800">
              Copy generation is limited to 200 leads at a time. Consider selecting fewer leads for optimal performance.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
