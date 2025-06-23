import { ToolDefinition } from "@core/prompts/model_prompts/jsonToolToXml"

export const newTerminalToolName = "NewTerminal"

const descriptionForAgent = (cwd: string) =>
	`在新终端中执行命令并显示结果。这个工具会创建一个新的VS Code终端实例，在其中执行指定的命令，并实时显示输出结果。适用于需要在独立终端环境中运行的长时间命令、服务启动、或需要与用户交互的命令。命令将在当前工作目录执行：${cwd}.

使用场景：
- 启动开发服务器 (npm start, python -m http.server等)
- 运行测试套件
- 执行需要用户交互的命令
- 长时间运行的进程
- 需要独立终端环境的命令

与execute_command的区别：
- execute_command: 在后台执行命令并返回完整结果
- new_terminal: 在新的可见终端中执行，允许实时查看输出和交互`

export const newTerminalToolDefinition = (cwd: string): ToolDefinition => ({
	name: newTerminalToolName,
	descriptionForAgent: descriptionForAgent(cwd),
	inputSchema: {
		type: "object",
		properties: {
			command: {
				type: "string",
				description: "要在新终端中执行的命令。命令应该适合当前操作系统，格式正确且不包含有害指令。",
			},
			terminal_name: {
				type: "string",
				description: "新终端的名称（可选）。如果不提供，将使用默认名称。有助于在多个终端之间进行区分。",
			},
			requires_approval: {
				type: "boolean",
				description:
					"布尔值，指示在用户启用自动批准模式时，此命令是否需要明确的用户批准。对于可能有影响的操作（如安装/卸载包、删除/覆盖文件、系统配置更改、网络操作或任何可能产生意外副作用的命令）设置为'true'。对于安全操作（如读取文件/目录、运行开发服务器、构建项目和其他非破坏性操作）设置为'false'。",
			},
		},
		required: ["command", "requires_approval"],
	},
})
