import React from 'react';
import { Search, X, FileDown, Filter as FilterIcon } from 'lucide-react';
import { MultiSelectDropdown } from './MultiSelectDropdown';

interface TaskFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterFeature: string;
  setFilterFeature: (value: string) => void;
  uniqueFeatures: string[];
  filterModule: string;
  setFilterModule: (value: string) => void;
  uniqueModules: string[];
  filterClient: string;
  setFilterClient: (value: string) => void;
  uniqueClients: string[];
  filterType: string;
  setFilterType: (value: string) => void;
  uniqueTypes: string[];
  filterStatus: string[];
  onStatusChange: (value: string) => void;
  uniqueStatuses: string[];
  filterNoEstimate: boolean;
  setFilterNoEstimate: (value: boolean) => void;
  filterDelayed: boolean;
  setFilterDelayed: (value: boolean) => void;
  filterAhead: boolean;
  setFilterAhead: (value: boolean) => void;
  filterTestNote: string;
  setFilterTestNote: (value: string) => void;
  hasFilters: boolean;
  clearFilters: () => void;
  onExport: () => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterFeature,
  setFilterFeature,
  uniqueFeatures,
  filterModule,
  setFilterModule,
  uniqueModules,
  filterClient,
  setFilterClient,
  uniqueClients,
  filterType,
  setFilterType,
  uniqueTypes,
  filterStatus,
  onStatusChange,
  uniqueStatuses,
  filterNoEstimate,
  setFilterNoEstimate,
  filterDelayed,
  setFilterDelayed,
  filterAhead,
  setFilterAhead,
  filterTestNote,
  setFilterTestNote,
  hasFilters,
  clearFilters,
  onExport,
}) => {
  return (
    <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 items-center">
        {/* Search Input */}
        <div className="relative md:col-span-2 lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por chave, resumo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>

        {/* Feature Filter */}
        <select
          value={filterFeature}
          onChange={(e) => setFilterFeature(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        >
          <option value="">Todas as Features</option>
          {uniqueFeatures.map((feature) => (
            <option key={feature} value={feature}>
              {feature}
            </option>
          ))}
        </select>

        {/* Module Filter */}
        <select
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        >
          <option value="">Todos os Módulos</option>
          {uniqueModules.map((module) => (
            <option key={module} value={module}>
              {module}
            </option>
          ))}
        </select>

        {/* Client Filter */}
        <select
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        >
          <option value="">Todos os Clientes</option>
          {uniqueClients.map((client) => (
            <option key={client} value={client}>
              {client}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        >
          <option value="">Todos os Tipos</option>
          {uniqueTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        {/* Test Note Filter */}
        <select
          value={filterTestNote}
          onChange={(e) => setFilterTestNote(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        >
          <option value="all">Todos (Nota de Teste)</option>
          <option value="with">Com nota de teste</option>
          <option value="without">Sem nota de teste</option>
        </select>

        {/* Status Filter */}
        <div className="md:col-span-2 lg:col-span-2">
          <MultiSelectDropdown
            options={uniqueStatuses}
            selectedOptions={filterStatus}
            onToggleOption={onStatusChange}
            placeholder="Filtrar por Status"
          />
        </div>

        {/* Checkbox Filters */}
        <div className="md:col-span-2 lg:col-span-2 flex items-center justify-around p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterNoEstimate}
              onChange={(e) => setFilterNoEstimate(e.target.checked)}
              className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Sem estimativa</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterDelayed}
              onChange={(e) => setFilterDelayed(e.target.checked)}
              className="w-5 h-5 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Atrasadas</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterAhead}
              onChange={(e) => setFilterAhead(e.target.checked)}
              className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Adiantadas</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="sm:col-span-2 md:col-span-4 lg:col-span-2 flex items-center justify-end gap-3">
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
              Limpar Filtros
            </button>
          )}
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            <FileDown className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>
    </div>
  );
};
