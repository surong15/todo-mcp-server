import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

export interface Task {
  id?: number;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  completed: boolean;
  created_at?: string;
  updated_at?: string;
  due_date?: string;
}

export class TodoDatabase {
  private db: sqlite3.Database;
  private initialized: boolean = false;

  constructor(dbPath: string = path.join(path.dirname(fileURLToPath(import.meta.url)), '../data/todo.db')) {
    this.db = new sqlite3.Database(dbPath);
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    await this.initDatabase();
    this.initialized = true;
  }

  private initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          priority TEXT DEFAULT 'medium',
          category TEXT DEFAULT 'general',
          completed BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          due_date DATETIME
        )
      `;

      this.db.run(createTableSQL, (err) => {
        if (err) {
          console.error('Error creating table:', err);
          reject(err);
        } else {
          console.log('Database initialized successfully');
          resolve();
        }
      });
    });
  }

  async addTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    await this.init();
    const sql = `
      INSERT INTO tasks (title, description, priority, category, completed, due_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    return new Promise((resolve, reject) => {
      this.db.run(sql, [
        task.title,
        task.description || null,
        task.priority,
        task.category,
        task.completed ? 1 : 0,
        task.due_date || null
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async getTasks(completed?: boolean): Promise<Task[]> {
    await this.init();
    let sql = 'SELECT * FROM tasks';
    let params: any[] = [];

    if (completed !== undefined) {
      sql += ' WHERE completed = ?';
      params.push(completed ? 1 : 0);
    }

    sql += ' ORDER BY created_at DESC';

    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const tasks = rows.map(row => ({
            ...row,
            completed: Boolean(row.completed)
          }));
          resolve(tasks);
        }
      });
    });
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<boolean> {
    await this.init();
    const fields: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(key === 'completed' ? (value ? 1 : 0) : value);
      }
    }

    if (fields.length === 0) {
      return false;
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);

    return new Promise((resolve, reject) => {
      this.db.run(sql, values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  async deleteTask(id: number): Promise<boolean> {
    await this.init();
    const sql = 'DELETE FROM tasks WHERE id = ?';
    
    return new Promise((resolve, reject) => {
      this.db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  async searchTasks(query: string): Promise<Task[]> {
    await this.init();
    const sql = `
      SELECT * FROM tasks 
      WHERE title LIKE ? OR description LIKE ? 
      ORDER BY created_at DESC
    `;
    const searchTerm = `%${query}%`;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [searchTerm, searchTerm], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const tasks = rows.map(row => ({
            ...row,
            completed: Boolean(row.completed)
          }));
          resolve(tasks);
        }
      });
    });
  }

  close(): void {
    this.db.close();
  }
}