import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { EmptyState } from './FeedbackStates';

export function Table({
  columns = [],
  data = [],
  searchable = true,
  searchPlaceholder = 'Search records...',
  searchKeys = [],
  itemsPerPage = 10,
  extraToolbar,
  onRowClick,
  emptyTitle = 'No records found',
  emptyMessage = 'No data matching your current filters or search term.',
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  // Filter by search
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((row) => {
      if (searchKeys.length > 0) {
        return searchKeys.some((k) => String(row[k] || '').toLowerCase().includes(term));
      }
      return Object.values(row).some((val) =>
        String(val || '').toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm, searchKeys]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA === valB) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;
      const comp = String(valA).localeCompare(String(valB), undefined, { numeric: true });
      return sortDirection === 'asc' ? comp : -comp;
    });
  }, [filteredData, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  function handleSort(key) {
    if (sortField === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(key);
      setSortDirection('asc');
    }
  }

  return (
    <div className="coep-table-container">
      {(searchable || extraToolbar) && (
        <div className="coep-table-toolbar">
          {searchable ? (
            <div style={{ position: 'relative', minWidth: '260px', flex: 1, maxWidth: '400px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary)',
                }}
              />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="coep-input"
                style={{ paddingLeft: '38px', height: '38px', fontSize: '13px' }}
              />
            </div>
          ) : <div />}

          {extraToolbar && <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>{extraToolbar}</div>}
        </div>
      )}

      {paginatedData.length === 0 ? (
        <EmptyState title={emptyTitle} message={emptyMessage} />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="coep-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key || col.title}
                    style={{ cursor: col.sortable ? 'pointer' : 'default', width: col.width }}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{col.title}</span>
                      {col.sortable && (
                        <ArrowUpDown size={13} style={{ opacity: sortField === col.key ? 1 : 0.4 }} />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  onClick={() => onRowClick && onRowClick(row)}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((col) => (
                    <td key={col.key || col.title}>
                      {col.render ? col.render(row[col.key], row, idx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            color: 'var(--text-secondary)',
          }}
        >
          <div>
            Showing <b>{(currentPage - 1) * itemsPerPage + 1}</b> to{' '}
            <b>{Math.min(currentPage * itemsPerPage, sortedData.length)}</b> of{' '}
            <b>{sortedData.length}</b> entries
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="coep-btn coep-btn-secondary coep-btn-sm"
              style={{ padding: '4px 8px' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              Page <b>{currentPage}</b> of <b>{totalPages}</b>
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="coep-btn coep-btn-secondary coep-btn-sm"
              style={{ padding: '4px 8px' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;
