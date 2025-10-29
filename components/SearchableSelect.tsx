import React, { useState, useEffect, useRef } from 'react';

interface SearchableSelectProps {
  options: string[];
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder = 'Select...' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
        setSearchTerm('');
    }
  }

  return (
    <div className="relative w-36" ref={wrapperRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="w-full p-1.5 text-sm text-left bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md flex justify-between items-center"
      >
        <span className={value ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}>
          {value || placeholder}
        </span>
        <svg className={`w-4 h-4 text-slate-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
          <div className="p-2">
            <input
              type="text"
              autoFocus
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <ul>
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <li
                  key={option}
                  onClick={() => handleSelect(option)}
                  className="px-3 py-1.5 text-sm cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/50"
                >
                  {option}
                </li>
              ))
            ) : (
              <li className="px-3 py-1.5 text-sm text-slate-500">No results found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
