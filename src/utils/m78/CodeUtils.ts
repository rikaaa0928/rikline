import { M78ServiceTool } from "./M78Service"

/**
 * 操作类型枚举
 */
export enum Action {
	CHAT = 1, // 聊天对话
	GENERATE_CODE = 2, // 根据注释生成代码
	CODE_SUGGESTION = 3, // 代码审查
	GENERATE_COMMENT = 4, // 生成注释
	SMART_NAMING = 5, // 智能命名
	GIT_PUSH = 6, // 一键提交
	UNIT_TEST = 7, // 方法级单元测试
	BUG_FIX = 8, // 修复代码
	INSERT_CODE_FROM_CHAT = 9, // 从聊天框插入代码到编辑区
	INLAY = 10, // inlay采纳代码
	GENERATE_CODE_IN_METHOD = 11, // 根据注释生成代码——方法内
	PV_UV = 12, // 启动插件，用于统计PV
	INLAY_GENERATOR = 13, // inlay生成代码
	CALL_BIZ_BOT = 14, // 调用业务自定义BOT
	CLASS_ANNOTATION_GENERATE = 15, // 生成类注释
	FUNCTION_GENERATE = 16, // 在已有项目上新增功能
	PROJECT_GENERATE = 17, // 生成项目代码
	FRONT_INLINE_CODE = 18, // 前端从聊天框插入代码到编辑区，其实就是inline生成代码
	BACKEND_INLINE_CODE = 19, // 后端从聊天框插入代码到编辑区，其实就是inline生成代码
	TOTAL_STATISTIC = 77, // 总新增代码行数
	GENERATE_FILE = 87, // 生成文件
	ALL_UNIT_TEST = 88, // 生成全部单测
}

/**
 * 操作类型详细信息接口
 */
export interface ActionInfo {
	code: number
	name: string
	/**
	 * 用于区分该行为是否统计AI生成的代码行数
	 */
	codeStatistics: boolean
	describe: string
}

/**
 * 操作类型详细信息映射
 */
export const ActionInfoMap: Record<Action, ActionInfo> = {
	[Action.CHAT]: { code: 1, name: "chat", codeStatistics: false, describe: "聊天对话" },
	[Action.GENERATE_CODE]: { code: 2, name: "generate_code", codeStatistics: true, describe: "根据注释生成代码" },
	[Action.CODE_SUGGESTION]: { code: 3, name: "code_suggestion", codeStatistics: false, describe: "代码审查" },
	[Action.GENERATE_COMMENT]: { code: 4, name: "generate_comment", codeStatistics: true, describe: "生成注释" },
	[Action.SMART_NAMING]: { code: 5, name: "smart_naming", codeStatistics: true, describe: "智能命名" },
	[Action.GIT_PUSH]: { code: 6, name: "git_push", codeStatistics: false, describe: "一键提交" },
	[Action.UNIT_TEST]: { code: 7, name: "unit_test", codeStatistics: true, describe: "方法级单元测试" },
	[Action.BUG_FIX]: { code: 8, name: "bug_fix", codeStatistics: false, describe: "修复代码" },
	[Action.INSERT_CODE_FROM_CHAT]: {
		code: 9,
		name: "insert_code_from_chat",
		codeStatistics: true,
		describe: "从聊天框插入代码到编辑区",
	},
	[Action.INLAY]: { code: 10, name: "inlay", codeStatistics: true, describe: "inlay采纳代码" },
	[Action.GENERATE_CODE_IN_METHOD]: {
		code: 11,
		name: "generate_code_in_method",
		codeStatistics: true,
		describe: "根据注释生成代码——方法内",
	},
	[Action.PV_UV]: { code: 12, name: "active_plugin", codeStatistics: false, describe: "启动插件，用于统计PV" },
	[Action.INLAY_GENERATOR]: { code: 13, name: "inlay_generator", codeStatistics: true, describe: "inlay生成代码" },
	[Action.CALL_BIZ_BOT]: { code: 14, name: "call_biz_bot", codeStatistics: false, describe: "调用业务自定义BOT" },
	[Action.CLASS_ANNOTATION_GENERATE]: {
		code: 15,
		name: "class_annotation_generate",
		codeStatistics: true,
		describe: "生成类注释",
	},
	[Action.FUNCTION_GENERATE]: { code: 16, name: "function_generate", codeStatistics: true, describe: "在已有项目上新增功能" },
	[Action.PROJECT_GENERATE]: { code: 17, name: "project_generate", codeStatistics: false, describe: "生成项目代码" },
	[Action.FRONT_INLINE_CODE]: {
		code: 18,
		name: "front_insert_code_from_chat",
		codeStatistics: true,
		describe: "前端从聊天框插入代码到编辑区，其实就是inline生成代码",
	},
	[Action.BACKEND_INLINE_CODE]: {
		code: 19,
		name: "backend_insert_code_from_chat",
		codeStatistics: true,
		describe: "后端从聊天框插入代码到编辑区，其实就是inline生成代码",
	},
	[Action.TOTAL_STATISTIC]: { code: 77, name: "total_statistic", codeStatistics: false, describe: "总新增代码行数" },
	[Action.GENERATE_FILE]: { code: 87, name: "generate_file", codeStatistics: false, describe: "生成文件" },
	[Action.ALL_UNIT_TEST]: { code: 88, name: "generate_all_unit_test", codeStatistics: true, describe: "生成全部单测" },
}

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
	/**
	 * 获取Action的详细信息
	 * @param action 操作类型
	 * @returns 操作类型详细信息
	 */
	public static getActionInfo(action: Action): ActionInfo {
		return ActionInfoMap[action]
	}

	/**
	 * 获取Action的名称
	 * @param action 操作类型
	 * @returns 名称字符串
	 */
	public static getActionName(action: Action): string {
		return ActionInfoMap[action].name
	}

	private static readonly CODE_STATISTICS_SOURCE_VSCODE = 2 // vscode

	/**
	 * 计算给定字符串中的行数
	 *
	 * @param code 要计算行数的字符串
	 * @param markDown 如果为true，则返回的行数减去2
	 * @returns 字符串中的行数，如果字符串为空或null，则返回0
	 */
	public static getLineCnt(code: string, markDown: boolean): number {
		if (code === null || code === "") {
			return 0
		}
		let lineCount = 1 // 如果字符串不为空至少有一行

		for (let i = 0; i < code.length; i++) {
			if (code.charAt(i) === "\n") {
				lineCount++
			}
		}
		if (markDown) {
			return Math.max(lineCount - 2, 0)
		}
		return lineCount
	}

	/**
	 * 统计传入字符串的长度，如果是空，返回0
	 * @param input 输入字符串
	 * @returns 字符串长度，如果为null则返回0
	 */
	public static getStringLength(input: string | null): number {
		return input === null ? 0 : input.length
	}

	/**
	 * 上传统计信息
	 * @param info 代码生成信息
	 * @param enableCodeStats 是否启用代码统计，默认为true
	 */
	public static async uploadCodeGenInfo(info: M78CodeGenerationInfo, enableCodeStats: boolean = true): Promise<void> {
		// 如果禁用了代码统计，直接返回
		if (!enableCodeStats) {
			console.log("Code statistics collection is disabled")
			return
		}

		try {
			const now = new Date().getTime()

			// 补充信息
			info.ctime = now
			info.utime = now
			info.source = this.CODE_STATISTICS_SOURCE_VSCODE
			info.username = info.username || process.env.USER || process.env.USERNAME || "unknown"
			info.pluginVersion = info.pluginVersion || "1.0.0" // 默认版本号
			info.systemVersion = info.systemVersion || process.platform
			info.ideVersion = info.ideVersion || "unknown" // 避免动态引入 vscode 模块
			info.type = info.type || 1
			info.action = info.action || 2

			// 异步上传
			setTimeout(async () => {
				try {
					const result = await M78ServiceTool.uploadCodeInfo(JSON.stringify(info))
					if (result.code === 0) {
						console.log("upload code info successful")
					} else {
						console.log("upload code info failed:", result.message)
					}
				} catch (error) {
					// Silently handle telemetry failures - don't spam console with errors
					console.log("M78 telemetry service unavailable")
				}
			}, 0)
		} catch (error) {
			console.error("prepare upload code info failed:", error)
		}
	}

	/**
	 * 上传代码生成信息 - 简化方法（对应Java的重载方法）
	 * @param code 代码内容
	 * @param comment 注释内容
	 * @param projectName 项目名称
	 * @param className 类名
	 * @param enableCodeStats 是否启用代码统计，默认为true
	 */
	public static async uploadCodeGenerationInfo(
		code: string,
		comment: string,
		projectName: string,
		className: string,
		enableCodeStats: boolean = true,
	): Promise<void> {
		await this.uploadCodeGenInfoWithAction(Action.GENERATE_CODE, code, comment, projectName, className, enableCodeStats)
	}

	/**
	 * 上传代码生成信息 - 完整参数方法
	 * @param action 操作类型
	 * @param code 代码内容
	 * @param comment 注释内容
	 * @param projectName 项目名称
	 * @param className 类名
	 * @param enableCodeStats 是否启用代码统计，默认为true
	 */
	public static async uploadCodeGenInfoWithAction(
		action: Action,
		code: string,
		comment: string,
		projectName: string,
		className: string,
		enableCodeStats: boolean = true,
	): Promise<void> {
		const info: M78CodeGenerationInfo = {
			action: action,
			annotation: comment,
			projectName: projectName,
			className: className,
			codeCharLength: this.getStringLength(code),
			codeLinesCount: this.getLineCnt(code, false),
		}

		await this.uploadCodeGenInfo(info, enableCodeStats)
	}
}
