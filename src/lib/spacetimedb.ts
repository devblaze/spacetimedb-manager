export interface SpacetimeDBConfig {
  // URL-based connection
  url?: string;
  // Host/Port-based connection
  host?: string;
  port?: number;
  // Common fields
  database?: string;
  token?: string;
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  primaryKey?: string[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
}

export interface QueryResult {
  success: boolean;
  data?: Record<string, unknown>[];
  error?: string;
  rowsAffected?: number;
}

export interface DatabaseInfo {
  identity: string;
  name: string;
  owner_identity: string;
  host_type: string;
}

export interface CreateDatabaseResult {
  success: boolean;
  database?: DatabaseInfo;
  error?: string;
}

export interface PublishResult {
  success: boolean;
  database_identity?: string;
  database_name?: string;
  error?: string;
}

export class SpacetimeDBClient {
  private config: SpacetimeDBConfig;
  private baseUrl: string;

  constructor(config: SpacetimeDBConfig) {
    this.config = config;
    
    if (config.url) {
      // Use provided URL directly
      this.baseUrl = config.url.endsWith('/') ? config.url.slice(0, -1) : config.url;
    } else if (config.host && config.port) {
      // Build URL from host and port
      const isLocal = config.host.includes('localhost') || 
                     config.host.includes('127.0.0.1') || 
                     config.host.startsWith('192.168.') || 
                     config.host.startsWith('10.') || 
                     config.host.startsWith('172.');
      const protocol = isLocal ? 'http' : 'https';
      this.baseUrl = `${protocol}://${config.host}:${config.port}`;
    } else {
      throw new Error('Either url or both host and port must be provided');
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }

    return fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers
    });
  }

  async connect(): Promise<boolean> {
    console.log(`Attempting to connect to SpacetimeDB at: ${this.baseUrl}`);
    
    try {
      // Test connection by trying different endpoints
      const endpoints = ['/databases', '/v1/databases', '/status', '/health'];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Testing endpoint: ${this.baseUrl}${endpoint}`);
          const response = await this.makeRequest(endpoint);
          
          console.log(`Endpoint ${endpoint} response:`, {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          });
          
          if (response.ok) {
            const data = await response.text();
            console.log(`Connection successful via ${endpoint}:`, data);
            return true;
          }
        } catch (endpointError) {
          console.log(`Endpoint ${endpoint} failed:`, endpointError);
          continue;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Failed to connect to SpacetimeDB:', error);
      return false;
    }
  }

  async getTables(databaseName?: string): Promise<TableInfo[]> {
    const dbName = databaseName || this.config.database;
    if (!dbName) {
      throw new Error('Database name is required to fetch tables');
    }

    try {
      const response = await this.makeRequest(`/database/${dbName}/schema`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch schema: ${response.statusText}`);
      }

      const data = await response.json();
      return data.tables || [];
    } catch (error) {
      console.error('Failed to fetch tables:', error);
      return [];
    }
  }

  async query(sql: string, databaseName?: string): Promise<QueryResult> {
    const dbName = databaseName || this.config.database;
    if (!dbName) {
      return {
        success: false,
        error: 'Database name is required to execute queries'
      };
    }

    try {
      const response = await this.makeRequest(`/database/${dbName}/sql`, {
        method: 'POST',
        body: JSON.stringify({ query: sql })
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Query failed: ${response.statusText}`
        };
      }

      const result = await response.json();
      return {
        success: true,
        data: result.rows || [],
        rowsAffected: result.rowsAffected
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getTableData(tableName: string, databaseName?: string, limit: number = 100, offset: number = 0): Promise<QueryResult> {
    const sql = `SELECT * FROM ${tableName} LIMIT ${limit} OFFSET ${offset}`;
    return this.query(sql, databaseName);
  }

  async insertData(tableName: string, data: Record<string, unknown>, databaseName?: string): Promise<QueryResult> {
    const dbName = databaseName || this.config.database;
    if (!dbName) {
      return {
        success: false,
        error: 'Database name is required for insert operations'
      };
    }

    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    try {
      const response = await this.makeRequest(`/database/${dbName}/sql`, {
        method: 'POST',
        body: JSON.stringify({ 
          query: sql,
          params: values
        })
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Insert failed: ${response.statusText}`
        };
      }

      const result = await response.json();
      return {
        success: true,
        rowsAffected: result.rowsAffected || 1
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Insert failed'
      };
    }
  }

  async updateData(tableName: string, data: Record<string, unknown>, where: Record<string, unknown>, databaseName?: string): Promise<QueryResult> {
    const dbName = databaseName || this.config.database;
    if (!dbName) {
      return {
        success: false,
        error: 'Database name is required for update operations'
      };
    }

    const setPairs = Object.keys(data).map(key => `${key} = ?`);
    const wherePairs = Object.keys(where).map(key => `${key} = ?`);
    
    const sql = `UPDATE ${tableName} SET ${setPairs.join(', ')} WHERE ${wherePairs.join(' AND ')}`;
    const params = [...Object.values(data), ...Object.values(where)];

    try {
      const response = await this.makeRequest(`/database/${dbName}/sql`, {
        method: 'POST',
        body: JSON.stringify({ 
          query: sql,
          params: params
        })
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Update failed: ${response.statusText}`
        };
      }

      const result = await response.json();
      return {
        success: true,
        rowsAffected: result.rowsAffected || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      };
    }
  }

  async deleteData(tableName: string, where: Record<string, unknown>, databaseName?: string): Promise<QueryResult> {
    const dbName = databaseName || this.config.database;
    if (!dbName) {
      return {
        success: false,
        error: 'Database name is required for delete operations'
      };
    }

    const wherePairs = Object.keys(where).map(key => `${key} = ?`);
    const sql = `DELETE FROM ${tableName} WHERE ${wherePairs.join(' AND ')}`;
    const params = Object.values(where);

    try {
      const response = await this.makeRequest(`/database/${dbName}/sql`, {
        method: 'POST',
        body: JSON.stringify({ 
          query: sql,
          params: params
        })
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Delete failed: ${response.statusText}`
        };
      }

      const result = await response.json();
      return {
        success: true,
        rowsAffected: result.rowsAffected || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  }

  async listDatabases(): Promise<string[]> {
    try {
      // Try different possible endpoints for listing databases
      const endpoints = ['/databases', '/v1/databases'];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${this.baseUrl}${endpoint}`);
          const response = await this.makeRequest(endpoint);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Database list response:', data);
            
            // Handle different response formats
            if (Array.isArray(data)) {
              return data.map(db => typeof db === 'string' ? db : db.name || db.identity);
            }
            if (data.databases && Array.isArray(data.databases)) {
              return data.databases.map((db: any) => typeof db === 'string' ? db : db.name || db.identity);
            }
            
            return [];
          }
        } catch (endpointError) {
          console.log(`Endpoint ${endpoint} failed:`, endpointError);
          continue;
        }
      }
      
      throw new Error('All database listing endpoints failed');
    } catch (error) {
      console.error('Failed to fetch databases:', error);
      return [];
    }
  }

  async createDatabase(name: string): Promise<CreateDatabaseResult> {
    try {
      const response = await this.makeRequest(`/v1/database/${name}`, {
        method: 'POST',
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Failed to create database: ${response.statusText} - ${errorText}`
        };
      }

      const result = await response.json();
      return {
        success: true,
        database: {
          identity: result.identity,
          name: name,
          owner_identity: result.owner_identity || '',
          host_type: result.host_type || 'unknown'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create database'
      };
    }
  }

  async publishModule(databaseName: string, wasmFile: File): Promise<PublishResult> {
    try {
      const formData = new FormData();
      formData.append('wasm_module', wasmFile);

      const response = await fetch(`${this.baseUrl}/v1/database/${databaseName}`, {
        method: 'POST',
        headers: {
          ...(this.config.token && { 'Authorization': `Bearer ${this.config.token}` })
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Failed to publish module: ${response.statusText} - ${errorText}`
        };
      }

      const result = await response.json();
      return {
        success: true,
        database_identity: result.identity,
        database_name: databaseName
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to publish module'
      };
    }
  }

  async getDatabaseInfo(nameOrIdentity: string): Promise<DatabaseInfo | null> {
    try {
      const response = await this.makeRequest(`/v1/database/${nameOrIdentity}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch database info: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        identity: data.identity,
        name: data.name || nameOrIdentity,
        owner_identity: data.owner_identity || '',
        host_type: data.host_type || 'unknown'
      };
    } catch (error) {
      console.error('Failed to fetch database info:', error);
      return null;
    }
  }

  async deleteDatabase(nameOrIdentity: string): Promise<boolean> {
    try {
      const response = await this.makeRequest(`/v1/database/${nameOrIdentity}`, {
        method: 'DELETE'
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to delete database:', error);
      return false;
    }
  }
}