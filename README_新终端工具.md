# 新终端工具 (new_terminal)

## 概述

`new_terminal` 是一个新的工具，用于在VS Code中创建新的终端实例并执行命令。与 `execute_command` 工具不同，`new_terminal` 会在一个可见的、独立的终端窗口中执行命令，允许用户实时查看输出并与命令进行交互。

## 主要特性

- **可视化执行**: 在新的VS Code终端标签页中执行命令
- **实时输出**: 用户可以看到命令的实时输出
- **交互支持**: 支持需要用户输入的交互式命令
- **自定义名称**: 可以为终端指定自定义名称以便识别
- **长时间运行**: 适合运行服务器、监控任务等长时间运行的命令

## 与 execute_command 的区别

| 特性 | execute_command | new_terminal |
|------|----------------|--------------|
| 执行方式 | 后台执行 | 新终端窗口中执行 |
| 输出显示 | 命令完成后返回全部输出 | 实时显示输出 |
| 用户交互 | 不支持交互 | 支持交互式命令 |
| 长时间任务 | 适合快速任务 | 适合长时间运行的任务 |
| 终端可见性 | 不可见 | 用户可见 |

## 使用场景

1. **开发服务器**: 启动 npm start, python -m http.server 等
2. **构建监控**: 运行 npm run watch, webpack --watch 等
3. **测试运行**: 执行测试套件并查看实时输出
4. **交互式工具**: 运行需要用户输入的命令行工具
5. **调试会话**: 启动调试器或日志查看工具

## 工具参数

- `command` (必需): 要执行的命令
- `terminal_name` (可选): 终端的自定义名称
- `requires_approval` (必需): 是否需要用户批准执行

## 示例用法

### 启动开发服务器
```xml
<new_terminal>
<command>npm start</command>
<terminal_name>Dev Server</terminal_name>
<requires_approval>false</requires_approval>
</new_terminal>
```

### 运行测试并监控
```xml
<new_terminal>
<command>npm test -- --watch</command>
<terminal_name>Test Watcher</terminal_name>
<requires_approval>false</requires_approval>
</new_terminal>
```

### 启动Python HTTP服务器
```xml
<new_terminal>
<command>python -m http.server 8000</command>
<terminal_name>HTTP Server</terminal_name>
<requires_approval>false</requires_approval>
</new_terminal>
```

## 技术实现

工具使用VS Code的 `createTerminal()` API创建新的终端实例，然后通过 `sendText()` 方法发送命令。终端会在VS Code界面中可见，用户可以与其进行交互。

## 自动批准设置

该工具遵循与 `execute_command` 相同的自动批准规则：
- 对于安全操作可以设置自动批准
- 对于可能有风险的操作需要用户确认
- 支持全局和特定命令的批准策略 