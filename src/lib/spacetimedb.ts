export interface SpacetimeDBConfig {
  host: string;
  port: number;
  database: string;
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

export class SpacetimeDBClient {
  private config: SpacetimeDBConfig;
  private baseUrl: string;

  constructor(config: SpacetimeDBConfig) {
    this.config = config;
    this.baseUrl = `http://${config.host}:${config.port}`;
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
    try {
      const response = await this.makeRequest('/health');
      return response.ok;
    } catch (error) {
      console.error('Failed to connect to SpacetimeDB:', error);
      return false;
    }
  }

  async getTables(): Promise<TableInfo[]> {
    try {
      const response = await this.makeRequest(`/database/${this.config.database}/schema`);
      
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

  async query(sql: string): Promise<QueryResult> {
    try {
      const response = await this.makeRequest(`/database/${this.config.database}/sql`, {
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

  async getTableData(tableName: string, limit: number = 100, offset: number = 0): Promise<QueryResult> {
    const sql = `SELECT * FROM ${tableName} LIMIT ${limit} OFFSET ${offset}`;
    return this.query(sql);
  }

  async insertData(tableName: string, data: Record<string, unknown>): Promise<QueryResult> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    try {
      const response = await this.makeRequest(`/database/${this.config.database}/sql`, {
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

  async updateData(tableName: string, data: Record<string, unknown>, where: Record<string, unknown>): Promise<QueryResult> {
    const setPairs = Object.keys(data).map(key => `${key} = ?`);
    const wherePairs = Object.keys(where).map(key => `${key} = ?`);
    
    const sql = `UPDATE ${tableName} SET ${setPairs.join(', ')} WHERE ${wherePairs.join(' AND ')}`;
    const params = [...Object.values(data), ...Object.values(where)];

    try {
      const response = await this.makeRequest(`/database/${this.config.database}/sql`, {
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

  async deleteData(tableName: string, where: Record<string, unknown>): Promise<QueryResult> {
    const wherePairs = Object.keys(where).map(key => `${key} = ?`);
    const sql = `DELETE FROM ${tableName} WHERE ${wherePairs.join(' AND ')}`;
    const params = Object.values(where);

    try {
      const response = await this.makeRequest(`/database/${this.config.database}/sql`, {
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
}