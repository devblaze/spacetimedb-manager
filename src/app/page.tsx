'use client';

import { useState } from 'react';
import { useSpacetimeDB } from '@/contexts/SpacetimeDBContext';
import { DatabaseConnection } from '@/components/DatabaseConnection';
import { TableList } from '@/components/TableList';
import { TableView } from '@/components/TableView';
import { QueryRunner } from '@/components/QueryRunner';
import { DatabaseManager } from '@/components/DatabaseManager';
import { Database, Table, Play, Settings } from 'lucide-react';

export default function Home() {
  const { isConnected, tables, connectionConfig } = useSpacetimeDB();
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tables' | 'query' | 'manage'>('tables');

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Database className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                SpacetimeDB Manager
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Connect to your SpacetimeDB instance to manage and view your data
            </p>
          </div>
          <DatabaseConnection />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  SpacetimeDB Manager
                </h1>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                <span>Connected to {connectionConfig?.host}:{connectionConfig?.port}</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 rounded">
                  {connectionConfig?.database}
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex">
            <button
              onClick={() => setActiveTab('tables')}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                activeTab === 'tables'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Table className="w-4 h-4" />
              Tables ({tables.length})
            </button>
            <button
              onClick={() => setActiveTab('query')}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                activeTab === 'query'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Play className="w-4 h-4" />
              SQL Query
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                activeTab === 'manage'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              Manage Databases
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-12 gap-6">
          {activeTab === 'tables' && (
            <>
              {/* Sidebar */}
              <div className="col-span-4">
                <TableList 
                  tables={tables}
                  selectedTable={selectedTable}
                  onSelectTable={setSelectedTable}
                />
              </div>

              {/* Main Content */}
              <div className="col-span-8">
                {selectedTable ? (
                  <TableView tableName={selectedTable} />
                ) : (
                  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
                    <Table className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Select a Table
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Choose a table from the sidebar to view and manage its data
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'query' && (
            <div className="col-span-12">
              <QueryRunner />
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="col-span-12">
              <DatabaseManager />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}