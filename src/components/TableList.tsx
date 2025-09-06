'use client';

import { TableInfo } from '@/lib/spacetimedb';
import { Table, RefreshCw } from 'lucide-react';
import { useSpacetimeDB } from '@/contexts/SpacetimeDBContext';

interface TableListProps {
  tables: TableInfo[];
  selectedTable: string | null;
  onSelectTable: (tableName: string) => void;
}

export function TableList({ tables, selectedTable, onSelectTable }: TableListProps) {
  const { refreshTables, isLoading } = useSpacetimeDB();

  const handleRefresh = async () => {
    await refreshTables();
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">Tables</h3>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded transition-colors disabled:opacity-50"
          title="Refresh tables"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-2">
        {tables.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Table className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tables found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {tables.map((table) => (
              <button
                key={table.name}
                onClick={() => onSelectTable(table.name)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  selectedTable === table.name
                    ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                    : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{table.name}</div>
                    <div className="text-xs opacity-75">
                      {table.columns.length} column{table.columns.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}