'use client';

import { useState } from 'react';
import { useSpacetimeDB } from '@/contexts/SpacetimeDBContext';
import { Plus, Upload, Database, Trash2, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export function DatabaseManager() {
  const { client } = useSpacetimeDB();
  const [isCreatingDatabase, setIsCreatingDatabase] = useState(false);
  const [isPublishingModule, setIsPublishingModule] = useState(false);
  const [newDatabaseName, setNewDatabaseName] = useState('');
  const [publishDatabaseName, setPublishDatabaseName] = useState('');
  const [moduleFile, setModuleFile] = useState<File | null>(null);
  const [databases, setDatabases] = useState<string[]>([]);
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false);

  const loadDatabases = async () => {
    if (!client) return;
    
    setIsLoadingDatabases(true);
    try {
      const databaseList = await client.listDatabases();
      setDatabases(databaseList);
    } catch (error) {
      console.error('Failed to load databases:', error);
      toast.error('Failed to load databases');
    } finally {
      setIsLoadingDatabases(false);
    }
  };

  const handleCreateDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !newDatabaseName.trim()) return;

    setIsCreatingDatabase(true);
    try {
      const result = await client.createDatabase(newDatabaseName.trim());
      
      if (result.success) {
        toast.success(`Database "${newDatabaseName}" created successfully!`);
        setNewDatabaseName('');
        loadDatabases(); // Refresh the list
      } else {
        toast.error(result.error || 'Failed to create database');
      }
    } catch (error) {
      toast.error('Failed to create database');
      console.error('Create database error:', error);
    } finally {
      setIsCreatingDatabase(false);
    }
  };

  const handlePublishModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !publishDatabaseName.trim() || !moduleFile) return;

    setIsPublishingModule(true);
    try {
      const result = await client.publishModule(publishDatabaseName.trim(), moduleFile);
      
      if (result.success) {
        toast.success(`Module published to "${publishDatabaseName}" successfully!`);
        setPublishDatabaseName('');
        setModuleFile(null);
        const fileInput = document.getElementById('module-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        toast.error(result.error || 'Failed to publish module');
      }
    } catch (error) {
      toast.error('Failed to publish module');
      console.error('Publish module error:', error);
    } finally {
      setIsPublishingModule(false);
    }
  };

  const handleDeleteDatabase = async (databaseName: string) => {
    if (!client) return;
    
    if (!confirm(`Are you sure you want to delete the database "${databaseName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const success = await client.deleteDatabase(databaseName);
      
      if (success) {
        toast.success(`Database "${databaseName}" deleted successfully!`);
        loadDatabases(); // Refresh the list
      } else {
        toast.error('Failed to delete database');
      }
    } catch (error) {
      toast.error('Failed to delete database');
      console.error('Delete database error:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.wasm')) {
        toast.error('Please select a WebAssembly (.wasm) file');
        e.target.value = '';
        return;
      }
      setModuleFile(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create New Database */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Create New Database
            </h2>
          </div>
        </div>
        <div className="p-6">
          <form onSubmit={handleCreateDatabase} className="space-y-4">
            <div>
              <label htmlFor="database-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Database Name
              </label>
              <input
                id="database-name"
                type="text"
                value={newDatabaseName}
                onChange={(e) => setNewDatabaseName(e.target.value)}
                placeholder="Enter database name"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isCreatingDatabase || !newDatabaseName.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingDatabase ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Database
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Publish Module */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Publish Module
            </h2>
          </div>
        </div>
        <div className="p-6">
          <form onSubmit={handlePublishModule} className="space-y-4">
            <div>
              <label htmlFor="publish-database-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Database Name
              </label>
              <input
                id="publish-database-name"
                type="text"
                value={publishDatabaseName}
                onChange={(e) => setPublishDatabaseName(e.target.value)}
                placeholder="Enter database name"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label htmlFor="module-file" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                WebAssembly Module (.wasm)
              </label>
              <input
                id="module-file"
                type="file"
                accept=".wasm"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                required
              />
              {moduleFile && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Selected: {moduleFile.name} ({(moduleFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isPublishingModule || !publishDatabaseName.trim() || !moduleFile}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPublishingModule ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Publish Module
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Database List */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Available Databases
              </h2>
            </div>
            <button
              onClick={loadDatabases}
              disabled={isLoadingDatabases}
              className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50"
            >
              {isLoadingDatabases ? (
                <div className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                'Refresh'
              )}
            </button>
          </div>
        </div>
        <div className="p-6">
          {databases.length === 0 ? (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No databases found</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Click &quot;Refresh&quot; to load databases or create a new one
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {databases.map((database) => (
                <div
                  key={database}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {database}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {}}
                      className="inline-flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Info className="w-3 h-3" />
                      Info
                    </button>
                    <button
                      onClick={() => handleDeleteDatabase(database)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}