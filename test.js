// 簡單的測試腳本
import { TodoDatabase } from './dist/database.js';

async function testDatabase() {
  console.log('Testing Todo Database...');
  
  const db = new TodoDatabase('./data/test.db');
  
  try {
    // 明確初始化數據庫
    console.log('Initializing database...');
    await db.init();
    
    // 測試新增任務
    console.log('\n1. Adding tasks...');
    const task1Id = await db.addTask({
      title: '完成 MCP server',
      description: '實作待辦清單功能',
      priority: 'high',
      category: '工作',
      completed: false
    });
    console.log(`Added task with ID: ${task1Id}`);
    
    const task2Id = await db.addTask({
      title: '買菜',
      priority: 'medium',
      category: '生活',
      completed: false
    });
    console.log(`Added task with ID: ${task2Id}`);
    
    // 測試列出任務
    console.log('\n2. Listing all tasks...');
    const allTasks = await db.getTasks();
    console.log(JSON.stringify(allTasks, null, 2));
    
    // 測試更新任務
    console.log('\n3. Updating task...');
    await db.updateTask(task1Id, { completed: true });
    console.log(`Task ${task1Id} marked as completed`);
    
    // 測試搜尋
    console.log('\n4. Searching tasks...');
    const searchResults = await db.searchTasks('MCP');
    console.log('Search results:', searchResults);
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    db.close();
  }
}

testDatabase();