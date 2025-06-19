// MCP 通訊測試腳本
import { spawn } from 'child_process';

function testMCPServer() {
  console.log('Testing MCP Server communication...');
  
  const server = spawn('node', ['dist/server.js'], {
    stdio: ['pipe', 'pipe', 'inherit']
  });

  // 測試 list_tools 請求
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  };

  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');

  server.stdout.on('data', (data) => {
    console.log('Server response:', data.toString());
  });

  server.on('error', (error) => {
    console.error('Server error:', error);
  });

  // 5秒後結束測試
  setTimeout(() => {
    server.kill();
    console.log('Test completed');
  }, 5000);
}

testMCPServer();