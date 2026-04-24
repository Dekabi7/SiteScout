"use client";

import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  country?: string;
  className?: string;
}

interface Suggestion {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export default function AutocompleteInput({ 
  value, 
  onChange, 
  placeholder = "Enter city, state, or zip code", 
  country,
  className = ""
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await apiClient.getCitySuggestions(value, country);
        if (response.success) {
          setSuggestions(response.suggestions);
          setIsOpen(response.suggestions.length > 0);
          setSelectedIndex(-1);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [value, country]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    onChange(suggestion.description);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-6 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
        required
      />
      
      {isLoading && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                index === selectedIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
              }`}
            >
              <div className="font-medium">{suggestion.structured_formatting.main_text}</div>
              <div className="text-sm text-gray-500">{suggestion.structured_formatting.secondary_text}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
