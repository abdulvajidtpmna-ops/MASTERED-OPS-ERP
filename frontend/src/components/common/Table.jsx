import React, { useState, useMemo } from 'react';
import { Search, Download, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { Button } from './Button';

export function Table({
  columns,
  data = [],
  keyField = 'id',
  searchable = true,
  searchPlaceholder = 'Search records...',
  exportable = true,
  exportFileName = 'export.csv',
  pageSize = 10,
  emptyTitle = 'No records found',
  emptyMessage = 'There are currently no items matching your criteria.',
  filterSlot,
  actionsSlot,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Search filtering
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((val) =>
        String(val || '').toLowerCase().includes(q)
      )
    );
  }, [data, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // CSV Export
  const handleExportCSV = () => {
    if (!filteredData.length) return;
    const visibleCols = columns.filter((c) => c.accessor);
    const headers = visibleCols.map((c) => `"${c.header}"`).join(',');
    const rows = filteredData.map((row) =>
      visibleCols
        .map((c) => {
          const val = typeof c.accessor === 'function' ? c.accessor(row) : row[c.accessor];
          return `"${String(val !== undefined && val !== null ? val : '').replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', exportFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm transition-all"
              />
            </div>
          )}
          {filterSlot}
        </div>

        <div className="flex items-center gap-2 justify-end">
          {actionsSlot}
          {exportable && (
            <Button
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={handleExportCSV}
              disabled={!filteredData.length}
            >
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-soft-blue overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-brand-900 to-brand-700 text-white font-poppins text-xs tracking-wider uppercase">
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className={`py-3.5 px-4 font-semibold ${col.className || ''}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((row, rowIdx) => (
                  <tr
                    key={row[keyField] || rowIdx}
                    className="hover:bg-brand-50/50 transition-colors duration-150"
                  >
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className={`py-3.5 px-4 ${col.className || ''}`}>
                        {col.cell
                          ? col.cell(row)
                          : typeof col.accessor === 'function'
                          ? col.accessor(row)
                          : row[col.accessor] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="p-3 bg-gray-100 rounded-full text-gray-400">
                        <Inbox className="w-8 h-8" />
                      </div>
                      <h5 className="font-poppins font-semibold text-gray-700">{emptyTitle}</h5>
                      <p className="text-xs text-gray-500 max-w-xs">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredData.length > pageSize && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
            <div>
              Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-gray-900">
                {Math.min(currentPage * pageSize, filteredData.length)}
              </span>{' '}
              of <span className="font-semibold text-gray-900">{filteredData.length}</span> results
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-semibold text-brand-900">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
