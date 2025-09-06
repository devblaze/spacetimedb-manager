'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SpacetimeDBClient, SpacetimeDBConfig, TableInfo } from '@/lib/spacetimedb';

interface SpacetimeDBContextValue {
  client: SpacetimeDBClient | null;
  isConnected: boolean;
  tables: TableInfo[];
  connectionConfig: SpacetimeDBConfig | null;
  currentDatabase: string | null;
  availableDatabases: string[];
  connect: (config: SpacetimeDBConfig) => Promise<boolean>;
  disconnect: () => void;
  switchDatabase: (databaseName: string) => Promise<void>;
  refreshTables: (databaseName?: string) => Promise<void>;
  refreshDatabases: () => Promise<void>;
  isLoading: boolean;
}

const SpacetimeDBContext = createContext<SpacetimeDBContextValue | undefined>(undefined);

export function SpacetimeDBProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<SpacetimeDBClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [connectionConfig, setConnectionConfig] = useState<SpacetimeDBConfig | null>(null);
  const [currentDatabase, setCurrentDatabase] = useState<string | null>(null);
  const [availableDatabases, setAvailableDatabases] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const connect = async (config: SpacetimeDBConfig): Promise<boolean> => {
    setIsLoading(true);
    try {
      const newClient = new SpacetimeDBClient(config);
      const connected = await newClient.connect();
      
      if (connected) {
        setClient(newClient);
        setConnectionConfig(config);
        setIsConnected(true);
        
        // Load available databases
        const databases = await newClient.listDatabases();
        setAvailableDatabases(databases);
        
        // If a specific database was provided, set it as current and load tables
        if (config.database) {
          setCurrentDatabase(config.database);
          const tableList = await newClient.getTables(config.database);
          setTables(tableList);
        } else {
          setTables([]);
          setCurrentDatabase(null);
        }
      }
      
      return connected;
    } catch (error) {
      console.error('Connection failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    setClient(null);
    setIsConnected(false);
    setTables([]);
    setConnectionConfig(null);
    setCurrentDatabase(null);
    setAvailableDatabases([]);
  };

  const switchDatabase = async (databaseName: string) => {
    if (!client) return;
    
    setIsLoading(true);
    try {
      setCurrentDatabase(databaseName);
      const tableList = await client.getTables(databaseName);
      setTables(tableList);
    } catch (error) {
      console.error('Failed to switch database:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTables = async (databaseName?: string) => {
    if (!client) return;
    
    const dbName = databaseName || currentDatabase;
    if (!dbName) return;
    
    setIsLoading(true);
    try {
      const tableList = await client.getTables(dbName);
      setTables(tableList);
    } catch (error) {
      console.error('Failed to refresh tables:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDatabases = async () => {
    if (!client) return;
    
    try {
      const databases = await client.listDatabases();
      setAvailableDatabases(databases);
    } catch (error) {
      console.error('Failed to refresh databases:', error);
    }
  };

  useEffect(() => {
    // Load saved connection config from localStorage on mount
    const savedConfig = localStorage.getItem('spacetimedb-config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        connect(config);
      } catch (error) {
        console.error('Failed to load saved config:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Save connection config to localStorage when it changes
    if (connectionConfig) {
      localStorage.setItem('spacetimedb-config', JSON.stringify(connectionConfig));
    } else {
      localStorage.removeItem('spacetimedb-config');
    }
  }, [connectionConfig]);

  return (
    <SpacetimeDBContext.Provider
      value={{
        client,
        isConnected,
        tables,
        connectionConfig,
        currentDatabase,
        availableDatabases,
        connect,
        disconnect,
        switchDatabase,
        refreshTables,
        refreshDatabases,
        isLoading,
      }}
    >
      {children}
    </SpacetimeDBContext.Provider>
  );
}

export function useSpacetimeDB() {
  const context = useContext(SpacetimeDBContext);
  if (context === undefined) {
    throw new Error('useSpacetimeDB must be used within a SpacetimeDBProvider');
  }
  return context;
}