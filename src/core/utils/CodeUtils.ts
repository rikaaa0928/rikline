import { M78ServiceTool } from "./m78/M78Service"

/**
 * 代码生成信息
 */
export interface M78CodeGenerationInfo {
	id?: number
	ctime?: number
	utime?: number
	state?: number
	projectName?: string
	className?: string
	codeLinesCount?: number
	methodName?: string
	username?: string
	/**
	 * 1 根据注释生成代码
	 * 2 inlay代码提示
	 */
	type?: number // 默认值 1
	annotation?: string
	/**
	 * 1 idea
	 * 2 vscode
	 */
	source?: number // 默认值 1
	pluginVersion?: string
	ip?: string
	systemVersion?: string
	/**
	 * 操作类型 (1聊天 2生成代码 3代码建议 4生成注释 5智能命名 6一键push 7单元测试 8bug_fix)
	 */
	action?: number // 默认值 2
	ideVersion?: string
	totalCodeLines?: number
	botId?: number
	/**
	 * 代码字符数
	 */
	codeCharLength?: number
}

/**
 * 代码工具类
 */
export class CodeUtils {
	private static readonly CODE_STATISTICS_SOURCE_VSCODE = 2 // vscode

	/**
	 * 上传统计信息
	 * @param info 代码生成信息
	 */
	public static async uploadCodeGenInfo(info: M78CodeGenerationInfo): Promise<void> {
		try {
			const now = new Date().getTime()

			// 补充信息
			info.ctime = now
			info.utime = now
			info.source = this.CODE_STATISTICS_SOURCE_VSCODE
			info.username = info.username || process.env.USER || process.env.USERNAME || "unknown"
			info.pluginVersion = info.pluginVersion || require("../../package.json").version
			info.systemVersion = info.systemVersion || process.platform
			info.ideVersion = info.ideVersion || require("vscode").version
			info.type = info.type || 1
			info.action = info.action || 2

			// 异步上传
			setTimeout(async () => {
				try {
					const ok = await M78ServiceTool.uploadCodeInfo(JSON.stringify(info))
					console.log("upload code info, status:", ok)
				} catch (error) {
					console.error("upload code info failed:", error)
				}
			}, 0)
		} catch (error) {
			console.error("prepare upload code info failed:", error)
		}
	}
}
