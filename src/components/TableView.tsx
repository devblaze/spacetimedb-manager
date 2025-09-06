'use client';

import { useState } from 'react';
import { useSpacetimeDB } from '@/contexts/SpacetimeDBContext';
import { useQuery } from '@tanstack/react-query';
import { TableInfo, QueryResult } from '@/lib/spacetimedb';
import { Table, Plus, Edit, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface TableViewProps {
  tableName: string;
}

export function TableView({ tableName }: TableViewProps) {
  const { client, tables } = useSpacetimeDB();
  const [page, setPage] = useState(0);
  const [limit] = useState(50);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null);

  const tableInfo = tables.find(t => t.name === tableName);

  const {
    data: tableData,
    isLoading,
    refetch,
    error: queryError
  } = useQuery({
    queryKey: ['table-data', tableName, page, limit],
    queryFn: async (): Promise<QueryResult> => {
      if (!client) throw new Error('No client available');
      return client.getTableData(tableName, limit, page * limit);
    },
    enabled: !!client && !!tableName,
  });

  const handleDelete = async (row: Record<string, unknown>) => {
    if (!client || !tableInfo) return;
    
    const primaryKeys = tableInfo.primaryKey || [tableInfo.columns[0]?.name];
    const whereClause: Record<string, unknown> = {};
    
    primaryKeys.forEach(key => {
      if (row[key] !== undefined) {
        whereClause[key] = row[key];
      }
    });

    if (Object.keys(whereClause).length === 0) {
      toast.error('Cannot delete row: No primary key found');
      return;
    }

    try {
      const result = await client.deleteData(tableName, whereClause);
      if (result.success) {
        toast.success('Row deleted successfully');
        refetch();
      } else {
        toast.error(result.error || 'Failed to delete row');
      }
    } catch (_error) {
      toast.error('Failed to delete row');
    }
  };

  const handleEdit = (row: Record<string, unknown>) => {
    setEditingRow(row);
    setShowAddForm(true);
  };

  const handleAdd = () => {
    setEditingRow(null);
    setShowAddForm(true);
  };

  const handleFormSubmit = async (formData: Record<string, unknown>) => {
    if (!client || !tableInfo) return;

    try {
      let result: QueryResult;
      
      if (editingRow) {
        // Update existing row
        const primaryKeys = tableInfo.primaryKey || [tableInfo.columns[0]?.name];
        const whereClause: Record<string, unknown> = {};
        
        primaryKeys.forEach(key => {
          if (editingRow[key] !== undefined) {
            whereClause[key] = editingRow[key];
          }
        });

        result = await client.updateData(tableName, formData, whereClause);
      } else {
        // Insert new row
        result = await client.insertData(tableName, formData);
      }

      if (result.success) {
        toast.success(editingRow ? 'Row updated successfully' : 'Row added successfully');
        setShowAddForm(false);
        setEditingRow(null);
        refetch();
      } else {
        toast.error(result.error || 'Operation failed');
      }
    } catch (_error) {
      toast.error('Operation failed');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-300">Loading table data...</p>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
        <div className="text-red-500 dark:text-red-400">
          <p>Failed to load table data</p>
          <p className="text-sm mt-1">{queryError instanceof Error ? queryError.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  if (!tableData?.success || !tableData.data) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
        <p className="text-gray-600 dark:text-gray-300">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Table className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">{tableName}</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({tableData.data.length} row{tableData.data.length !== 1 ? 's' : ''})
          </span>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Row
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-700">
            <tr>
              {tableInfo?.columns.map((column) => (
                <th
                  key={column.name}
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {column.name}
                  <span className="ml-1 text-xs font-normal lowercase">
                    ({column.type})
                  </span>
                </th>
              ))}
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {tableData.data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                {tableInfo?.columns.map((column) => (
                  <td key={column.name} className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                    <div className="max-w-xs truncate">
                      {row[column.name] !== null ? String(row[column.name]) : (
                        <span className="text-gray-400 italic">null</span>
                      )}
                    </div>
                  </td>
                ))}
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleEdit(row)}
                      className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded transition-colors"
                      title="Edit row"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(row)}
                      className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Delete row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {tableData.data.length === limit && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 dark:border-slate-700">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Page {page + 1}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={tableData.data.length < limit}
              className="p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && tableInfo && (
        <TableRowForm
          tableInfo={tableInfo}
          initialData={editingRow}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowAddForm(false);
            setEditingRow(null);
          }}
        />
      )}
    </div>
  );
}

interface TableRowFormProps {
  tableInfo: TableInfo;
  initialData: Record<string, unknown> | null;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}

function TableRowForm({ tableInfo, initialData, onSubmit, onCancel }: TableRowFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const data: Record<string, string> = {};
    tableInfo.columns.forEach(column => {
      data[column.name] = initialData?.[column.name]?.toString() || '';
    });
    return data;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const processedData: Record<string, unknown> = {};
    tableInfo.columns.forEach(column => {
      const value = formData[column.name];
      if (value === '' && column.nullable) {
        processedData[column.name] = null;
      } else if (column.type.toLowerCase().includes('int') || column.type.toLowerCase().includes('number')) {
        processedData[column.name] = parseInt(value) || 0;
      } else if (column.type.toLowerCase().includes('float') || column.type.toLowerCase().includes('double')) {
        processedData[column.name] = parseFloat(value) || 0;
      } else if (column.type.toLowerCase().includes('bool')) {
        processedData[column.name] = value.toLowerCase() === 'true';
      } else {
        processedData[column.name] = value;
      }
    });

    onSubmit(processedData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {initialData ? 'Edit Row' : 'Add New Row'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {tableInfo.columns.map((column) => (
            <div key={column.name}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {column.name}
                <span className="ml-1 text-xs text-gray-500">({column.type})</span>
                {!column.nullable && <span className="text-red-500">*</span>}
              </label>
              <input
                type={
                  column.type.toLowerCase().includes('int') || 
                  column.type.toLowerCase().includes('number') ||
                  column.type.toLowerCase().includes('float') ||
                  column.type.toLowerCase().includes('double')
                    ? 'number' 
                    : column.type.toLowerCase().includes('bool')
                    ? 'text'
                    : 'text'
                }
                value={formData[column.name]}
                onChange={(e) => setFormData(prev => ({ ...prev, [column.name]: e.target.value }))}
                placeholder={
                  column.type.toLowerCase().includes('bool') 
                    ? 'true or false'
                    : column.nullable 
                    ? 'Leave empty for null' 
                    : `Enter ${column.name}`
                }
                required={!column.nullable}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>
          ))}
          
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              {initialData ? 'Update' : 'Add'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium py-2 px-4 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}