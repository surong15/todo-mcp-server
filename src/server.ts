#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { TodoDatabase, Task } from './database.js';

class TodoMCPServer {
  private server: Server;
  private db: TodoDatabase;

  constructor() {
    this.server = new Server(
      {
        name: 'todo-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.db = new TodoDatabase();
    // 先初始化數據庫，然後設置處理器
    this.initializeAndSetup();
  }

  private async initializeAndSetup(): Promise<void> {
    await this.db.init();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'add_task',
            description: 'Add a new task to the todo list',
            inputSchema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Task title',
                },
                description: {
                  type: 'string',
                  description: 'Task description (optional)',
                },
                priority: {
                  type: 'string',
                  enum: ['high', 'medium', 'low'],
                  description: 'Task priority',
                  default: 'medium',
                },
                category: {
                  type: 'string',
                  description: 'Task category',
                  default: 'general',
                },
                due_date: {
                  type: 'string',
                  description: 'Due date in YYYY-MM-DD format (optional)',
                },
              },
              required: ['title'],
            },
          },
          {
            name: 'list_tasks',
            description: 'List all tasks or filter by completion status',
            inputSchema: {
              type: 'object',
              properties: {
                completed: {
                  type: 'boolean',
                  description: 'Filter by completion status (optional)',
                },
              },
            },
          },
          {
            name: 'update_task',
            description: 'Update an existing task',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'Task ID',
                },
                title: {
                  type: 'string',
                  description: 'New task title (optional)',
                },
                description: {
                  type: 'string',
                  description: 'New task description (optional)',
                },
                priority: {
                  type: 'string',
                  enum: ['high', 'medium', 'low'],
                  description: 'New task priority (optional)',
                },
                category: {
                  type: 'string',
                  description: 'New task category (optional)',
                },
                completed: {
                  type: 'boolean',
                  description: 'Mark task as completed/incomplete (optional)',
                },
                due_date: {
                  type: 'string',
                  description: 'New due date in YYYY-MM-DD format (optional)',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'toggle_task',
            description: 'Toggle task completion status',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'Task ID',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'delete_task',
            description: 'Delete a task',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  description: 'Task ID',
                },
              },
              required: ['id'],
            },
          },
          {
            name: 'search_tasks',
            description: 'Search tasks by title or description',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query',
                },
              },
              required: ['query'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: argsRaw } = request.params;
        const args = argsRaw as Record<string, unknown> | undefined;

        switch (name) {
          case 'add_task': {
            if (!args || typeof args !== 'object') throw new Error('Invalid arguments');
            const title = typeof args.title === 'string' ? args.title : '';
            const description = typeof args.description === 'string' ? args.description : undefined;
            const priority = args.priority === 'high' || args.priority === 'medium' || args.priority === 'low' ? args.priority : 'medium';
            const category = typeof args.category === 'string' ? args.category : 'general';
            const due_date = typeof args.due_date === 'string' ? args.due_date : undefined;

            const taskId = await this.db.addTask({
              title,
              description,
              priority,
              category,
              completed: false,
              due_date,
            });

            return {
              content: [
                {
                  type: 'text',
                  text: `Task added successfully with ID: ${taskId}`,
                },
              ],
            };
          }

          case 'list_tasks': {
            const completed = typeof args?.completed === 'boolean' ? args.completed : undefined;
            const tasks = await this.db.getTasks(completed);
            const taskList = tasks.map(task => {
              const status = task.completed ? '✅' : '⏳';
              const priority = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
              const dueDate = task.due_date ? ` (Due: ${task.due_date})` : '';
              return `${status} [${task.id}] ${priority} ${task.title}${dueDate}\n   Category: ${task.category}${task.description ? `\n   ${task.description}` : ''}`;
            }).join('\n\n');

            return {
              content: [
                {
                  type: 'text',
                  text: tasks.length > 0 ? taskList : 'No tasks found.',
                },
              ],
            };
          }

          case 'update_task': {
            if (!args || typeof args !== 'object') throw new Error('Invalid arguments');
            const id = typeof args.id === 'number' ? args.id : undefined;
            if (id === undefined) throw new Error('Task id is required');
            const updates: Record<string, unknown> = { ...args };
            delete updates.id;
            const success = await this.db.updateTask(id, updates);

            return {
              content: [
                {
                  type: 'text',
                  text: success ? `Task ${id} updated successfully` : `Task ${id} not found`,
                },
              ],
            };
          }

          case 'toggle_task': {
            if (!args || typeof args !== 'object') throw new Error('Invalid arguments');
            const id = typeof args.id === 'number' ? args.id : undefined;
            if (id === undefined) throw new Error('Task id is required');
            const tasks = await this.db.getTasks();
            const task = tasks.find(t => t.id === id);
            
            if (!task) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Task ${id} not found`,
                  },
                ],
              };
            }

            const success = await this.db.updateTask(id, { completed: !task.completed });
            const newStatus = !task.completed ? 'completed' : 'incomplete';

            return {
              content: [
                {
                  type: 'text',
                  text: success ? `Task ${id} marked as ${newStatus}` : `Failed to update task ${id}`,
                },
              ],
            };
          }

          case 'delete_task': {
            if (!args || typeof args !== 'object') throw new Error('Invalid arguments');
            const id = typeof args.id === 'number' ? args.id : undefined;
            if (id === undefined) throw new Error('Task id is required');
            const success = await this.db.deleteTask(id);

            return {
              content: [
                {
                  type: 'text',
                  text: success ? `Task ${id} deleted successfully` : `Task ${id} not found`,
                },
              ],
            };
          }

          case 'search_tasks': {
            if (!args || typeof args !== 'object') throw new Error('Invalid arguments');
            const query = typeof args.query === 'string' ? args.query : '';
            const tasks = await this.db.searchTasks(query);
            const taskList = tasks.map(task => {
              const status = task.completed ? '✅' : '⏳';
              const priority = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
              return `${status} [${task.id}] ${priority} ${task.title}\n   Category: ${task.category}${task.description ? `\n   ${task.description}` : ''}`;
            }).join('\n\n');

            return {
              content: [
                {
                  type: 'text',
                  text: tasks.length > 0 ? `Found ${tasks.length} task(s):\n\n${taskList}` : `No tasks found matching "${query}".`,
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Todo MCP server running on stdio');
  }
}

const server = new TodoMCPServer();
server.run().catch(console.error);