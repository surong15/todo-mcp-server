# Todo MCP Server

個人待辦清單 MCP Server，讓 AI 助手能夠幫你管理任務。
（程式碼皆由Claude生成）

## 功能特色

- ✅ 新增、編輯、刪除任務
- 🎯 設定優先級（高/中/低）
- 📂 任務分類管理
- 🔍 搜尋任務功能
- ✅ 標記完成狀態
- 📅 設定截止日期
- 💾 本地 SQLite 資料庫儲存

## 安裝步驟

1. **安裝依賴套件**
```bash
npm install
```

2. **編譯 TypeScript**
```bash
npm run build
```

3. **測試功能**
```bash
node test.js
```

## 配置 Claude Desktop

1. 找到 Claude Desktop 的設定檔：
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. 在設定檔中新增 MCP server：
```json
{
  "mcpServers": {
    "todo": {
      "command": "node",
      "args": ["/path/to/your/todo-mcp-server/dist/server.js"],
      "cwd": "/path/to/your/todo-mcp-server"
    }
  }
}
```

3. 重新啟動 Claude Desktop

## 使用方法

用 `node dist/server.js` 啟動server

### 新增任務
```
幫我新增一個任務：完成專案報告，優先級是高，分類是工作
```

### 查看任務列表
```
顯示我所有的未完成任務
```

### 標記完成
```
把任務 ID 1 標記為完成
```

### 搜尋任務
```
搜尋包含「報告」的任務
```

### 更新任務
```
修改任務 2 的標題為「購買生活用品」
```

### 刪除任務
```
刪除任務 ID 3
```

## 可用的 MCP 工具

| 工具名稱 | 功能 |
|---------|------|
| `add_task` | 新增任務 |
| `list_tasks` | 列出任務 |
| `update_task` | 更新任務 |
| `toggle_task` | 切換完成狀態 |
| `delete_task` | 刪除任務 |
| `search_tasks` | 搜尋任務 |

## 資料庫位置

任務資料存放在 `data/todo.db`，你可以：
- 備份這個檔案來保存資料
- 刪除這個檔案來重新開始
- 使用 SQLite 工具直接查看資料

## 故障排除

1. **無法連接 MCP Server**
   - 確認路徑設定正確
   - 檢查是否已編譯 TypeScript
   - 查看 Claude Desktop 的錯誤日誌

2. **資料庫錯誤**
   - 確認 `data/` 目錄存在
   - 檢查檔案權限

3. **功能異常**
   - 執行 `node test.js` 測試基本功能
   - 查看終端錯誤訊息

## 開發

- `npm run dev` - 編譯並啟動
- `npm run build` - 僅編譯
- `npm run clean` - 清理編譯檔案

## 擴展功能

你可以輕鬆添加新功能：

1. 在 `database.ts` 中新增資料庫方法
2. 在 `server.ts` 中新增對應的 MCP 工具
3. 重新編譯並測試

建議的擴展功能：
- 任務提醒
- 重複任務
- 子任務支援
- 時間追蹤
- 匯出功能# todo-mcp-server
