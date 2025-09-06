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
  const { isConnected, tables, connectionConfig, currentDatabase, availableDatabases, switchDatabase } = useSpacetimeDB();
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tables' | 'query' | 'manage'>('manage');

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
                {currentDatabase ? (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 rounded">
                      {currentDatabase}
                    </span>
                    <select
                      value={currentDatabase}
                      onChange={(e) => switchDatabase(e.target.value)}
                      className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded"
                    >
                      {availableDatabases.map((db) => (
                        <option key={db} value={db}>
                          {db}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 rounded">
                    Server Connected ({availableDatabases.length} databases)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex">
            <button
              onClick={() => setActiveTab('tables')}
              disabled={!currentDatabase}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === 'tables'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Table className="w-4 h-4" />
              Tables ({currentDatabase ? tables.length : 0})
            </button>
            <button
              onClick={() => setActiveTab('query')}
              disabled={!currentDatabase}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
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
          {activeTab === 'tables' && currentDatabase && (
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

          {activeTab === 'query' && currentDatabase && (
            <div className="col-span-12">
              <QueryRunner />
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="col-span-12">
              <DatabaseManager />
            </div>
          )}

          {(activeTab === 'tables' || activeTab === 'query') && !currentDatabase && (
            <div className="col-span-12">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
                <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Select a Database
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Choose a database to view tables and run queries, or create a new one in the Manage tab
                </p>
                {availableDatabases.length > 0 ? (
                  <div className="flex flex-col items-center gap-4">
                    <select
                      onChange={(e) => e.target.value && switchDatabase(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                      defaultValue=""
                    >
                      <option value="">Select a database...</option>
                      {availableDatabases.map((db) => (
                        <option key={db} value={db}>
                          {db}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveTab('manage')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Settings className="w-4 h-4" />
                    Go to Manage Databases
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}