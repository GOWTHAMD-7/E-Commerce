import React, { useState, useEffect, useRef } from 'react';
import { fetchSearchSuggestions } from '../api';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function SearchBar({ searchQuery, setSearchQuery }: SearchBarProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce fetching suggestions
  useEffect(() => {
    let active = true;

    if (searchQuery.trim() === '') {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const fetchFn = async () => {
      setLoading(true);
      try {
        const data = await fetchSearchSuggestions(searchQuery);
        if (active) {
          setSuggestions(data);
          setShowDropdown(true);
          setActiveIndex(-1);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    const delayFn = setTimeout(() => {
      fetchFn();
    }, 300);

    return () => {
      active = false;
      clearTimeout(delayFn);
    };
  }, [searchQuery]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[activeIndex]);
      } else {
        setShowDropdown(false);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowDropdown(false);
  };

  // Helper to highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, index) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <strong key={index} className="text-[#111113] font-extrabold">{part}</strong>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    );
  };

  return (
    <div className="relative w-full max-w-xl group" ref={dropdownRef}>
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <svg className="w-5 h-5 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </div>
      <input
        type="text"
        className="w-full pl-11 pr-10 py-2.5 text-sm text-slate-800 bg-white border border-[#E5E5E7] rounded-full shadow-sm focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all placeholder-slate-400 font-medium"
        placeholder="Search products, brands, categories..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          if (!showDropdown) setShowDropdown(true);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (searchQuery.trim() !== '') setShowDropdown(true);
        }}
      />
      {searchQuery && (
        <button 
          type="button" 
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none" 
          onClick={() => {
            setSearchQuery('');
            setShowDropdown(false);
          }}
          aria-label="Clear search"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-slate-300 border-t-[#111113] rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>
      )}

      {/* Autocomplete Dropdown */}
      {showDropdown && searchQuery.trim() !== '' && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden transform origin-top transition-all animate-in fade-in slide-in-from-top-2">
          {loading && suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500 text-center">
              <div className="inline-block w-4 h-4 border-2 border-slate-300 border-t-[#111113] rounded-full animate-spin mr-2 align-middle"></div>
              Searching...
            </div>
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500 text-center">
              No suggestions found
            </div>
          ) : (
            <ul className="max-h-60 overflow-y-auto m-0 p-0 list-none">
              {suggestions.map((suggestion, index) => (
                <li 
                  key={index}
                  className={`px-4 py-3 cursor-pointer text-sm transition-colors border-b last:border-b-0 border-slate-100 flex items-center gap-2 ${
                    index === activeIndex ? 'bg-[#FAFAFA] text-[#111113]' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <span className="truncate">
                    {highlightMatch(suggestion, searchQuery)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
