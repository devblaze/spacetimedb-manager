'use client';

import { useState } from 'react';
import { useSpacetimeDB } from '@/contexts/SpacetimeDBContext';
import { QueryResult } from '@/lib/spacetimedb';
import { Play, Copy, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function QueryRunner() {
  const { client } = useSpacetimeDB();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunQuery = async () => {
    if (!client || !query.trim()) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const queryResult = await client.query(query.trim());
      setResult(queryResult);
      
      if (!queryResult.success) {
        setError(queryResult.error || 'Query failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Query execution failed';
      setError(errorMessage);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResults = () => {
    if (!result || !result.data) return;
    
    const text = JSON.stringify(result.data, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Results copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy results');
    });
  };

  const handleDownloadResults = () => {
    if (!result || !result.data) return;
    
    const text = JSON.stringify(result.data, null, 2);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Results downloaded');
  };

  const exampleQueries = [
    'SELECT * FROM users LIMIT 10;',
    'SELECT COUNT(*) FROM orders;',
    'SELECT * FROM products WHERE price > 100;',
    'INSERT INTO users (name, email) VALUES (\'John Doe\', \'john@example.com\');',
    'UPDATE users SET last_login = NOW() WHERE id = 1;',
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Play className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">SQL Query Runner</h3>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Query Input */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label htmlFor="query" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SQL Query
              </label>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white font-mono text-sm"
                placeholder="Enter your SQL query here..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRunQuery}
                disabled={!query.trim() || isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded transition-colors disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Run Query
              </button>

              {result && result.data && (
                <div className="flex gap-1">
                  <button
                    onClick={handleCopyResults}
                    className="flex items-center gap-1 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                  <button
                    onClick={handleDownloadResults}
                    className="flex items-center gap-1 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              )}
            </div>

            {/* Results */}
            {(result || error) && (
              <div className="border border-gray-200 dark:border-gray-600 rounded-md">
                <div className="px-3 py-2 bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-gray-600">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Query Results
                    {result?.success && result.data && (
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        ({result.data.length} row{result.data.length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </h4>
                </div>
                
                <div className="p-3">
                  {error ? (
                    <div className="text-red-600 dark:text-red-400 text-sm font-mono">
                      Error: {error}
                    </div>
                  ) : result?.success ? (
                    result.data && result.data.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-600">
                              {Object.keys(result.data[0]).map((key) => (
                                <th key={key} className="text-left p-2 font-medium text-gray-900 dark:text-white">
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.data.slice(0, 100).map((row: Record<string, unknown>, index: number) => (
                              <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                                {Object.values(row).map((value: unknown, cellIndex) => (
                                  <td key={cellIndex} className="p-2 text-gray-700 dark:text-gray-300">
                                    {value !== null ? String(value) : (
                                      <span className="text-gray-400 italic">null</span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {result.data.length > 100 && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Showing first 100 rows of {result.data.length} total rows
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-600 dark:text-gray-400 text-sm">
                        Query executed successfully
                        {result.rowsAffected !== undefined && (
                          <span className="ml-1">({result.rowsAffected} row{result.rowsAffected !== 1 ? 's' : ''} affected)</span>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="text-red-600 dark:text-red-400 text-sm">
                      Query failed: {result?.error || 'Unknown error'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Example Queries */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Example Queries</h4>
            <div className="space-y-2">
              {exampleQueries.map((exampleQuery, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(exampleQuery)}
                  className="w-full p-2 text-left text-xs font-mono bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 border border-gray-200 dark:border-gray-600 rounded transition-colors"
                >
                  {exampleQuery}
                </button>
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
              <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Tips:</h5>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Use semicolon to end statements</li>
                <li>• Be careful with DELETE/UPDATE queries</li>
                <li>• Use LIMIT for large datasets</li>
                <li>• Check table schemas before querying</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}