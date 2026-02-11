import React, { useState, useMemo, useEffect } from 'react';
import { LogEntry, LogFilter } from '../types';
import { formatDate, getTraceLevelColor, cn } from '../utils';
import { Search, ChevronLeft, ChevronRight, X, Filter } from 'lucide-react';

interface LogTableProps {
  logs: LogEntry[];
  filters: LogFilter;
  onFilterChange: (filters: LogFilter) => void;
  onLogClick: (log: LogEntry) => void;
}

const ROWS_PER_PAGE = 50;

const LogTable: React.FC<LogTableProps> = ({ logs, filters, onFilterChange, onLogClick }) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Extract unique components for filter
  const uniqueComponents = useMemo(() => {
    return Array.from(new Set(logs.map(l => l.component))).sort();
  }, [logs]);

  // Extract unique levels for filter
  const uniqueLevels = useMemo(() => {
    return Array.from(new Set(logs.map(l => l.traceLevel))).sort();
  }, [logs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = filters.search === '' || 
        log.message.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.operationName?.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesLevel = filters.level === '' || log.traceLevel === filters.level;
      const matchesComponent = filters.component === '' || log.component === filters.component;

      return matchesSearch && matchesLevel && matchesComponent;
    });
  }, [logs, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / ROWS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const clearFilters = () => {
    onFilterChange({ search: '', level: '', component: '' });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
      {/* Header & Filters */}
      <div className="p-4 border-b border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            Log Entries <span className="text-slate-400 font-normal text-sm">({filteredLogs.length} matches)</span>
          </h2>
          
          <div className="flex gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                 type="text"
                 placeholder="Search messages..."
                 value={filters.search}
                 onChange={(e) => {
                   onFilterChange({ ...filters, search: e.target.value });
                 }}
                 className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               />
               {filters.search && (
                 <button 
                   onClick={() => onFilterChange({ ...filters, search: '' })}
                   className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                 >
                   <X className="w-3 h-3" />
                 </button>
               )}
             </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
           <select 
             className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-blue-500"
             value={filters.level}
             onChange={(e) => {
                onFilterChange({ ...filters, level: e.target.value });
             }}
           >
             <option value="">All Levels</option>
             {uniqueLevels.map(lvl => (
               <option key={lvl} value={lvl}>{lvl}</option>
             ))}
           </select>

           <select 
             className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-blue-500"
             value={filters.component}
             onChange={(e) => {
                onFilterChange({ ...filters, component: e.target.value });
             }}
           >
             <option value="">All Components</option>
             {uniqueComponents.map(comp => (
               <option key={comp} value={comp}>{comp}</option>
             ))}
           </select>

           {(filters.component || filters.level || filters.search) && (
             <button 
               onClick={clearFilters}
               className="text-sm text-blue-600 hover:text-blue-800 font-medium px-2 py-1.5"
             >
               Clear Filters
             </button>
           )}
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-600 w-48">Timestamp</th>
              <th className="px-4 py-3 font-semibold text-slate-600 w-24">Level</th>
              <th className="px-4 py-3 font-semibold text-slate-600 w-40">Component</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log, index) => (
                <tr 
                  key={index}
                  onClick={() => onLogClick(log)}
                  className="hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-2 text-slate-500 font-mono text-xs whitespace-nowrap">
                    {formatDate(log.eventTimestamp)}
                  </td>
                  <td className="px-4 py-2">
                    <span className={cn("px-2 py-1 rounded text-xs font-medium border", getTraceLevelColor(log.traceLevel))}>
                      {log.traceLevel}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-700 font-medium truncate max-w-[150px]" title={log.component}>
                    {log.component}
                  </td>
                  <td className="px-4 py-2 text-slate-600 max-w-lg truncate" title={log.message}>
                    {log.message}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                  No logs found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-slate-200 flex items-center justify-between bg-slate-50 rounded-b-xl">
        <span className="text-xs text-slate-500">
          Showing {paginatedLogs.length > 0 ? (currentPage - 1) * ROWS_PER_PAGE + 1 : 0} to {Math.min(currentPage * ROWS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length} entries
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <span className="text-xs font-medium text-slate-700">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogTable;