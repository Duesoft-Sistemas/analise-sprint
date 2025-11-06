import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface MultiSelectDropdownProps {
  options: string[];
  selectedOptions: string[];
  onToggleOption: (option: string) => void;
  placeholder: string;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedOptions,
  onToggleOption,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getButtonLabel = () => {
    if (selectedOptions.length === 0) {
      return placeholder;
    }
    if (selectedOptions.length === 1) {
      return selectedOptions[0];
    }
    return `${selectedOptions.length} selecionados`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex justify-between items-center"
      >
        <span>{getButtonLabel()}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <input
                type="checkbox"
                checked={selectedOptions.includes(option)}
                onChange={() => onToggleOption(option)}
                className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm text-gray-900 dark:text-white">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};



