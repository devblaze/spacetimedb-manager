'use client';

import { useState } from 'react';
import { useSpacetimeDB } from '@/contexts/SpacetimeDBContext';
import { Database, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function DatabaseConnection() {
  const { connect, isLoading } = useSpacetimeDB();
  const [formData, setFormData] = useState({
    host: 'localhost',
    port: 3000,
    database: 'spacetimedb',
    token: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const config = {
      host: formData.host,
      port: parseInt(formData.port.toString()),
      database: formData.database,
      token: formData.token || undefined,
    };

    try {
      const success = await connect(config);
      if (success) {
        toast.success('Connected to SpacetimeDB successfully!');
      } else {
        const errorMessage = 'Failed to connect to SpacetimeDB. Please check your configuration.';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Database Connection
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="host" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Host
            </label>
            <input
              type="text"
              id="host"
              name="host"
              value={formData.host}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
              placeholder="localhost"
              required
            />
          </div>

          <div>
            <label htmlFor="port" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Port
            </label>
            <input
              type="number"
              id="port"
              name="port"
              value={formData.port}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
              placeholder="3000"
              required
              min="1"
              max="65535"
            />
          </div>

          <div>
            <label htmlFor="database" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Database Name
            </label>
            <input
              type="text"
              id="database"
              name="database"
              value={formData.database}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
              placeholder="spacetimedb"
              required
            />
          </div>

          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Access Token <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="password"
              id="token"
              name="token"
              value={formData.token}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
              placeholder="Enter access token if required"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-800 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                Connect
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          <p>Make sure your SpacetimeDB instance is running and accessible.</p>
        </div>
      </div>
    </div>
  );
}