'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SpacetimeDBClient, SpacetimeDBConfig, TableInfo } from '@/lib/spacetimedb';

interface SpacetimeDBContextValue {
  client: SpacetimeDBClient | null;
  isConnected: boolean;
  tables: TableInfo[];
  connectionConfig: SpacetimeDBConfig | null;
  connect: (config: SpacetimeDBConfig) => Promise<boolean>;
  disconnect: () => void;
  refreshTables: () => Promise<void>;
  isLoading: boolean;
}

const SpacetimeDBContext = createContext<SpacetimeDBContextValue | undefined>(undefined);

export function SpacetimeDBProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<SpacetimeDBClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [connectionConfig, setConnectionConfig] = useState<SpacetimeDBConfig | null>(null);
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
        
        // Load tables after successful connection
        const tableList = await newClient.getTables();
        setTables(tableList);
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
  };

  const refreshTables = async () => {
    if (!client) return;
    
    setIsLoading(true);
    try {
      const tableList = await client.getTables();
      setTables(tableList);
    } catch (error) {
      console.error('Failed to refresh tables:', error);
    } finally {
      setIsLoading(false);
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
        connect,
        disconnect,
        refreshTables,
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