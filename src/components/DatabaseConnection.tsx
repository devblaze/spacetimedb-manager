'use client';

import { useState } from 'react';
import { useSpacetimeDB } from '@/contexts/SpacetimeDBContext';
import { Database, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function DatabaseConnection() {
  const { connect, isLoading } = useSpacetimeDB();
  const [connectionMode, setConnectionMode] = useState<'url' | 'host-port'>('host-port');
  const [formData, setFormData] = useState({
    url: '',
    host: 'localhost',
    port: 3000,
    database: '',
    token: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const config = connectionMode === 'url' 
      ? {
          url: formData.url,
          database: formData.database || undefined,
          token: formData.token || undefined,
        }
      : {
          host: formData.host,
          port: parseInt(formData.port.toString()),
          database: formData.database || undefined,
          token: formData.token || undefined,
        };

    try {
      console.log('Attempting connection with config:', config);
      const success = await connect(config);
      if (success) {
        toast.success('Connected to SpacetimeDB successfully!');
      } else {
        const errorMessage = connectionMode === 'url' 
          ? `Failed to connect to ${config.url}. Please check the URL and ensure SpacetimeDB is running.`
          : `Failed to connect to ${config.host}:${config.port}. Please check the host, port, and ensure SpacetimeDB is running.`;
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Connection failed with config:', config);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Connection error:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'port' ? parseInt(value) || 0 : value 
    }));
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
          {/* Connection Mode Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Connection Method
            </label>
            <div className="flex rounded-md shadow-sm">
              <button
                type="button"
                onClick={() => setConnectionMode('host-port')}
                className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                  connectionMode === 'host-port'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                }`}
              >
                Host & Port
              </button>
              <button
                type="button"
                onClick={() => setConnectionMode('url')}
                className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-b border-r ${
                  connectionMode === 'url'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                }`}
              >
                URL
              </button>
            </div>
          </div>

          {connectionMode === 'url' ? (
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                SpacetimeDB URL
              </label>
              <input
                type="url"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                placeholder="https://your-spacetimedb.example.com"
                required
              />
            </div>
          ) : (
            <>
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
            </>
          )}

          <div>
            <label htmlFor="database" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Database Name <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              id="database"
              name="database"
              value={formData.database}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
              placeholder="Leave empty to connect to server without selecting a database"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Connect without a database name to manage multiple databases
            </p>
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