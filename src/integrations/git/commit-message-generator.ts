import * as vscode from "vscode"
import { getWorkingState } from "@utils/git"

/**
 * Conventional commit types based on the specification
 */
export interface ConventionalCommitType {
	type: string
	description: string
	emoji?: string
}

export const CONVENTIONAL_COMMIT_TYPES: ConventionalCommitType[] = [
	{ type: "feat", description: "新功能 (A new feature)", emoji: "✨" },
	{ type: "fix", description: "修复 (A bug fix)", emoji: "🐛" },
	{ type: "docs", description: "文档 (Documentation only changes)", emoji: "📚" },
	{ type: "style", description: "格式 (Changes that do not affect the meaning of the code)", emoji: "💎" },
	{ type: "refactor", description: "重构 (A code change that neither fixes a bug nor adds a feature)", emoji: "♻️" },
	{ type: "perf", description: "性能 (A code change that improves performance)", emoji: "⚡" },
	{ type: "test", description: "测试 (Adding missing tests or correcting existing tests)", emoji: "🧪" },
	{ type: "build", description: "构建 (Changes that affect the build system or external dependencies)", emoji: "📦" },
	{ type: "ci", description: "CI (Changes to our CI configuration files and scripts)", emoji: "🎡" },
	{ type: "chore", description: "杂项 (Other changes that don't modify src or test files)", emoji: "🔧" },
	{ type: "revert", description: "回滚 (Reverts a previous commit)", emoji: "⏪" },
]

/**
 * Analyzes git diff to determine the most appropriate conventional commit type
 * @param gitDiff The git diff to analyze
 * @returns The suggested commit type and confidence score
 */
function analyzeCommitType(gitDiff: string): { type: string; confidence: number; reasoning: string } {
	const lowerDiff = gitDiff.toLowerCase()
	const addedLines = (gitDiff.match(/^\+(?!\+)/gm) || []).length
	const removedLines = (gitDiff.match(/^-(?!-)/gm) || []).length
	const modifiedFiles = (gitDiff.match(/^diff --git/gm) || []).length

	// File type analysis
	const hasDocFiles = /\.(md|txt|rst|docs?|readme)/i.test(gitDiff)
	const hasTestFiles = /\.(test|spec)\./i.test(gitDiff) || /\/tests?\//i.test(gitDiff)
	const hasConfigFiles =
		/\.(json|yaml|yml|toml|ini|config|env)/i.test(gitDiff) ||
		/package\.json|tsconfig|webpack|babel|eslint|prettier/i.test(gitDiff)
	const hasCIFiles = /\.github\/workflows|\.gitlab-ci|jenkins|circle|travis/i.test(gitDiff)
	const hasBuildFiles = /build|makefile|dockerfile|cmake/i.test(gitDiff)

	// Content analysis patterns
	const patterns = [
		// New features
		{
			pattern: /(\+.*)(new|add|implement|create|introduce)(\s+feature|\s+function|\s+method|\s+component)/i,
			type: "feat",
			weight: 3,
		},
		{ pattern: /(\+.*)(export|import).*function/i, type: "feat", weight: 2 },
		{ pattern: /(\+.*)(class|interface|type).*\{/i, type: "feat", weight: 2 },

		// Bug fixes
		{ pattern: /(fix|repair|resolve|correct|patch)(\s+bug|\s+issue|\s+error|\s+problem)/i, type: "fix", weight: 3 },
		{ pattern: /(\+.*)(if|else|try|catch|error|exception)/i, type: "fix", weight: 1 },
		{ pattern: /(remove|delete).*bug/i, type: "fix", weight: 2 },

		// Documentation
		{ pattern: /(update|add|improve|fix).*documentation/i, type: "docs", weight: 3 },
		{ pattern: /(comment|readme|docs)/i, type: "docs", weight: 1 },

		// Performance
		{ pattern: /(optimize|performance|faster|speed|efficiency)/i, type: "perf", weight: 3 },
		{ pattern: /(cache|lazy|async|parallel)/i, type: "perf", weight: 1 },

		// Refactoring
		{ pattern: /(refactor|restructure|reorganize|cleanup|clean\s+up)/i, type: "refactor", weight: 3 },
		{ pattern: /(extract|move|rename).*function/i, type: "refactor", weight: 2 },

		// Style
		{ pattern: /(format|formatting|indent|spacing|semicolon|whitespace)/i, type: "style", weight: 3 },
		{ pattern: /(prettier|eslint|lint)/i, type: "style", weight: 2 },

		// Tests
		{ pattern: /(test|spec|assert|expect|mock)/i, type: "test", weight: 2 },

		// Build
		{ pattern: /(build|compile|bundle|webpack|rollup)/i, type: "build", weight: 2 },
		{ pattern: /(dependency|dependencies|package)/i, type: "build", weight: 1 },

		// CI
		{ pattern: /(ci|pipeline|workflow|deploy|deployment)/i, type: "ci", weight: 2 },

		// Chores
		{ pattern: /(version|release|tag)/i, type: "chore", weight: 1 },
		{ pattern: /(update|upgrade).*version/i, type: "chore", weight: 2 },
	]

	let scores: Record<string, { score: number; reasons: string[] }> = {}

	// Initialize scores
	CONVENTIONAL_COMMIT_TYPES.forEach((ct) => {
		scores[ct.type] = { score: 0, reasons: [] }
	})

	// File type based scoring
	if (hasDocFiles && modifiedFiles <= 3) {
		scores.docs.score += 5
		scores.docs.reasons.push("修改文档文件")
	}

	if (hasTestFiles) {
		scores.test.score += 4
		scores.test.reasons.push("修改测试文件")
	}

	if (hasConfigFiles && !hasTestFiles && !hasDocFiles) {
		scores.build.score += 3
		scores.build.reasons.push("修改配置文件")
	}

	if (hasCIFiles) {
		scores.ci.score += 4
		scores.ci.reasons.push("修改CI配置")
	}

	if (hasBuildFiles) {
		scores.build.score += 3
		scores.build.reasons.push("修改构建文件")
	}

	// Pattern matching
	patterns.forEach(({ pattern, type, weight }) => {
		const matches = gitDiff.match(pattern)
		if (matches) {
			scores[type].score += weight
			scores[type].reasons.push(`匹配模式: ${pattern.source.slice(0, 50)}...`)
		}
	})

	// Change analysis
	if (addedLines > removedLines * 2) {
		scores.feat.score += 2
		scores.feat.reasons.push("大量新增代码")
	} else if (removedLines > addedLines * 2) {
		scores.refactor.score += 1
		scores.refactor.reasons.push("大量删除代码")
	}

	// Find the highest scoring type
	let bestType = "feat"
	let bestScore = 0
	let bestReasons: string[] = []

	Object.entries(scores).forEach(([type, { score, reasons }]) => {
		if (score > bestScore) {
			bestScore = score
			bestType = type
			bestReasons = reasons
		}
	})

	// Default to feat if no clear pattern
	if (bestScore === 0) {
		bestType = addedLines > 0 ? "feat" : "refactor"
		bestReasons = [addedLines > 0 ? "包含新增代码" : "主要是代码修改"]
		bestScore = 1
	}

	const confidence = Math.min(bestScore / 5, 1) // Normalize to 0-1
	const reasoning = bestReasons.join(", ")

	return { type: bestType, confidence, reasoning }
}

/**
 * Extracts scope from file paths in git diff
 * @param gitDiff The git diff to analyze
 * @returns Suggested scope or empty string
 */
function extractScope(gitDiff: string): string {
	const fileMatches = gitDiff.match(/^diff --git a\/(.+?) b\//gm)
	if (!fileMatches || fileMatches.length === 0) {
		return ""
	}

	const filePaths = fileMatches
		.map((match) => {
			const pathMatch = match.match(/a\/(.+?) b\//)
			return pathMatch ? pathMatch[1] : ""
		})
		.filter(Boolean)

	// Find common directory or module
	const commonPaths = filePaths.map((path) => {
		const parts = path.split("/")
		return parts.length > 1 ? parts[0] : parts[0].split(".")[0]
	})

	// Get most common path/module
	const pathCount: Record<string, number> = {}
	commonPaths.forEach((path) => {
		pathCount[path] = (pathCount[path] || 0) + 1
	})

	const mostCommon = Object.entries(pathCount).sort(([, a], [, b]) => b - a)[0]

	if (mostCommon && mostCommon[1] > 1 && filePaths.length <= 5) {
		return mostCommon[0]
	}

	return ""
}

/**
 * Generates a conventional commit message based on git diff
 * @param gitDiff The git diff to analyze
 * @param useEmoji Whether to include emoji in the commit message
 * @returns Formatted conventional commit message
 */
export function generateConventionalCommitMessage(
	gitDiff: string,
	useEmoji: boolean = false,
): {
	message: string
	analysis: {
		type: string
		scope: string
		confidence: number
		reasoning: string
		suggestions: string[]
	}
} {
	const { type, confidence, reasoning } = analyzeCommitType(gitDiff)
	const scope = extractScope(gitDiff)
	const emoji = useEmoji ? CONVENTIONAL_COMMIT_TYPES.find((ct) => ct.type === type)?.emoji || "" : ""

	// Generate description based on diff analysis
	const addedLines = (gitDiff.match(/^\+(?!\+)/gm) || []).length
	const removedLines = (gitDiff.match(/^-(?!-)/gm) || []).length
	const modifiedFiles = (gitDiff.match(/^diff --git/gm) || []).length

	let description = ""

	// File-based descriptions
	if (gitDiff.includes("package.json")) {
		if (type === "build") {
			description = "update dependencies"
		} else if (type === "feat") {
			description = "add new dependency"
		}
	} else if (gitDiff.includes("README") || gitDiff.includes(".md")) {
		description = "update documentation"
	} else if (gitDiff.includes("test") || gitDiff.includes("spec")) {
		description = "add test coverage"
	} else {
		// Generic descriptions based on type
		switch (type) {
			case "feat":
				description = modifiedFiles === 1 ? "add new functionality" : "implement new features"
				break
			case "fix":
				description = "resolve issues"
				break
			case "refactor":
				description = "improve code structure"
				break
			case "docs":
				description = "update documentation"
				break
			case "style":
				description = "format code"
				break
			case "test":
				description = "add tests"
				break
			case "build":
				description = "update build configuration"
				break
			case "ci":
				description = "update CI pipeline"
				break
			case "perf":
				description = "improve performance"
				break
			default:
				description = "update code"
		}
	}

	// Build the commit message
	const emojiPrefix = emoji ? `${emoji} ` : ""
	const scopeStr = scope ? `(${scope})` : ""
	const message = `${emojiPrefix}${type}${scopeStr}: ${description}`

	// Generate suggestions for improvement
	const suggestions: string[] = []

	if (confidence < 0.5) {
		suggestions.push("考虑手动调整提交类型，AI分析置信度较低")
	}

	if (!scope && modifiedFiles > 1) {
		suggestions.push("考虑添加scope来明确修改的模块或组件")
	}

	if (message.length > 72) {
		suggestions.push("提交消息标题较长，考虑简化描述")
	}

	if (addedLines + removedLines > 500) {
		suggestions.push("变更较大，考虑拆分为多个提交")
	}

	return {
		message,
		analysis: {
			type,
			scope,
			confidence,
			reasoning,
			suggestions,
		},
	}
}

/**
 * Formats the git diff into a prompt for the AI with conventional commits guidance
 * @param gitDiff The git diff to format
 * @returns A formatted prompt for the AI
 */
export function formatGitDiffPrompt(gitDiff: string): string {
	// Limit the diff size to avoid token limits
	const maxDiffLength = 5000
	let truncatedDiff = gitDiff

	if (gitDiff.length > maxDiffLength) {
		truncatedDiff = gitDiff.substring(0, maxDiffLength) + "\n\n[Diff truncated due to size]"
	}

	const { message, analysis } = generateConventionalCommitMessage(gitDiff)

	return `Based on the following git diff, generate a conventional commit message following the specification:

${truncatedDiff}

请遵循 Conventional Commits 规范生成提交消息:

格式: <type>[optional scope]: <description>

可用的类型:
- feat: 新功能
- fix: 修复bug  
- docs: 文档变更
- style: 代码格式变更
- refactor: 重构
- perf: 性能优化
- test: 测试相关
- build: 构建相关
- ci: CI配置变更
- chore: 其他杂项

AI分析建议:
- 推荐类型: ${analysis.type}
- 推荐scope: ${analysis.scope || "无"}
- 置信度: ${(analysis.confidence * 100).toFixed(0)}%
- 分析原因: ${analysis.reasoning}
- 建议消息: ${message}

提交消息要求:
1. 使用英文，简洁明了
2. 动词使用祈使句形式 (例如: "add" 而不是 "added")
3. 描述做了什么改动和为什么
4. 标题控制在50-72字符内
5. 如有需要可添加详细的body和footer

请生成符合规范的提交消息:`
}

/**
 * Extracts the commit message from the AI response
 * @param aiResponse The response from the AI
 * @returns The extracted commit message
 */
export function extractCommitMessage(aiResponse: string): string {
	// Remove any markdown formatting or extra text
	let message = aiResponse.trim()

	// Remove markdown code blocks if present
	if (message.startsWith("```") && message.endsWith("```")) {
		message = message.substring(3, message.length - 3).trim()

		// Remove language identifier if present (e.g., ```git)
		const firstLineBreak = message.indexOf("\n")
		if (firstLineBreak > 0 && firstLineBreak < 20) {
			// Reasonable length for a language identifier
			message = message.substring(firstLineBreak).trim()
		}
	}

	// Extract just the commit message line if there are multiple lines
	const lines = message.split("\n")
	if (lines.length > 1) {
		// Find the line that looks like a commit message (starts with type:)
		const commitLine = lines.find((line) =>
			/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+?\))?\s*:\s*.+/.test(line.trim()),
		)
		if (commitLine) {
			return commitLine.trim()
		}
		// Otherwise return the first non-empty line
		return lines.find((line) => line.trim())?.trim() || message
	}

	return message
}

/**
 * Copies the generated commit message to the clipboard
 * @param message The commit message to copy
 */
export async function copyCommitMessageToClipboard(message: string): Promise<void> {
	await vscode.env.clipboard.writeText(message)
	vscode.window.showInformationMessage("Commit message copied to clipboard")
}

/**
 * Shows a dialog with options to apply the generated commit message
 * @param message The generated commit message
 * @param analysis Optional analysis information to show
 */
export async function showCommitMessageOptions(
	message: string,
	analysis?: {
		type: string
		scope: string
		confidence: number
		reasoning: string
		suggestions: string[]
	},
	autoApply?: boolean,
): Promise<void> {
	if (autoApply) {
		await applyCommitMessageToGitInput(message)
		return
	}

	const copyAction = "Copy to Clipboard"
	const applyAction = "Apply to Git Input"
	const editAction = "Edit Message"
	const analysisAction = analysis ? "View Analysis" : undefined

	let detail = message
	if (analysis) {
		detail += `\n\n分析结果:\n类型: ${analysis.type}`
		if (analysis.scope) {
			detail += ` (${analysis.scope})`
		}
		detail += `\n置信度: ${(analysis.confidence * 100).toFixed(0)}%`
		if (analysis.suggestions.length > 0) {
			detail += `\n建议: ${analysis.suggestions.join(", ")}`
		}
	}

	const actions = [copyAction, applyAction, editAction, analysisAction].filter(Boolean) as string[]

	const selectedAction = await vscode.window.showInformationMessage(
		"Conventional commit message generated",
		{ modal: false, detail },
		...actions,
	)

	// Handle user dismissing the dialog (selectedAction is undefined)
	if (!selectedAction) {
		return
	}

	switch (selectedAction) {
		case copyAction:
			await copyCommitMessageToClipboard(message)
			break
		case applyAction:
			await applyCommitMessageToGitInput(message)
			break
		case editAction:
			await editCommitMessage(message)
			break
		case analysisAction:
			if (analysis) {
				await showAnalysisDetails(analysis)
			}
			break
	}
}

/**
 * Shows detailed analysis information
 * @param analysis The analysis to display
 */
async function showAnalysisDetails(analysis: {
	type: string
	scope: string
	confidence: number
	reasoning: string
	suggestions: string[]
}): Promise<void> {
	const content = `# Commit Analysis

## 推荐类型: ${analysis.type}
${CONVENTIONAL_COMMIT_TYPES.find((ct) => ct.type === analysis.type)?.description || ""}

## Scope: ${analysis.scope || "无"}

## 置信度: ${(analysis.confidence * 100).toFixed(0)}%

## 分析原因:
${analysis.reasoning}

## 建议:
${analysis.suggestions.length > 0 ? analysis.suggestions.map((s) => `- ${s}`).join("\n") : "无特殊建议"}

## Conventional Commits 类型说明:
${CONVENTIONAL_COMMIT_TYPES.map((ct) => `- **${ct.type}**: ${ct.description}`).join("\n")}
`

	const document = await vscode.workspace.openTextDocument({
		content,
		language: "markdown",
	})

	await vscode.window.showTextDocument(document)
}

/**
 * Applies the commit message to the Git input box in the Source Control view
 * @param message The commit message to apply
 */
export async function applyCommitMessageToGitInput(message: string): Promise<void> {
	// Set the SCM input box value
	const gitExtension = vscode.extensions.getExtension("vscode.git")?.exports
	if (gitExtension) {
		const api = gitExtension.getAPI(1)
		if (api && api.repositories.length > 0) {
			const repo = api.repositories[0]
			repo.inputBox.value = message
			vscode.window.showInformationMessage("Commit message applied to Git input")
		} else {
			vscode.window.showErrorMessage("No Git repositories found")
			await copyCommitMessageToClipboard(message)
		}
	} else {
		vscode.window.showErrorMessage("Git extension not found")
		await copyCommitMessageToClipboard(message)
	}
}

/**
 * Opens the commit message in an editor for further editing
 * @param message The commit message to edit
 */
async function editCommitMessage(message: string): Promise<void> {
	const document = await vscode.workspace.openTextDocument({
		content: message,
		language: "markdown",
	})

	await vscode.window.showTextDocument(document)
	vscode.window.showInformationMessage("Edit the commit message and copy when ready")
}

/**
 * Shows an interactive wizard to manually create a conventional commit message
 */
export async function showConventionalCommitWizard(): Promise<void> {
	try {
		// Step 1: Select commit type
		const typeItems = CONVENTIONAL_COMMIT_TYPES.map((ct) => ({
			label: `${ct.emoji || ""} ${ct.type}`,
			description: ct.description,
			detail: `Type: ${ct.type}`,
			type: ct.type,
		}))

		const selectedType = await vscode.window.showQuickPick(typeItems, {
			placeHolder: "选择提交类型 (Select commit type)",
			title: "Conventional Commit Wizard - Step 1/4",
		})

		if (!selectedType) {
			return
		}

		// Step 2: Enter scope (optional)
		const scope = await vscode.window.showInputBox({
			prompt: "输入作用域 (Enter scope - optional)",
			placeHolder: "例如: api, ui, auth, docs (leave blank for no scope)",
			title: "Conventional Commit Wizard - Step 2/4",
		})

		// Step 3: Enter description
		const description = await vscode.window.showInputBox({
			prompt: "输入简短描述 (Enter brief description)",
			placeHolder: "例如: add user authentication, fix login bug",
			title: "Conventional Commit Wizard - Step 3/4",
			validateInput: (value) => {
				if (!value.trim()) {
					return "描述不能为空 (Description cannot be empty)"
				}
				if (value.length > 72) {
					return "描述过长，建议控制在72字符内 (Description too long, keep under 72 characters)"
				}
				return null
			},
		})

		if (!description) {
			return
		}

		// Step 4: Enter body (optional)
		const addBody = await vscode.window.showQuickPick(
			[
				{ label: "$(check) No", description: "Just use the title", picked: true },
				{ label: "$(edit) Yes", description: "Add detailed body and/or footer" },
			],
			{
				placeHolder: "添加详细说明？ (Add detailed body?)",
				title: "Conventional Commit Wizard - Step 4/4",
			},
		)

		let fullMessage = ""
		const scopeStr = scope?.trim() ? `(${scope.trim()})` : ""
		const titleLine = `${selectedType.type}${scopeStr}: ${description.trim()}`

		if (addBody?.label.includes("Yes")) {
			const body = await vscode.window.showInputBox({
				prompt: "输入详细说明 (Enter detailed body - optional)",
				placeHolder: "解释变更的原因和内容... (Explain what and why...)",
				title: "Add Body",
			})

			const footer = await vscode.window.showInputBox({
				prompt: "输入页脚信息 (Enter footer - optional)",
				placeHolder: "例如: Closes #123, BREAKING CHANGE: ...",
				title: "Add Footer",
			})

			fullMessage = titleLine
			if (body?.trim()) {
				fullMessage += `\n\n${body.trim()}`
			}
			if (footer?.trim()) {
				fullMessage += `\n\n${footer.trim()}`
			}
		} else {
			fullMessage = titleLine
		}

		// Show final message with options
		await showCommitMessageOptions(fullMessage, {
			type: selectedType.type,
			scope: scope?.trim() || "",
			confidence: 1,
			reasoning: "手动创建 (Manually created)",
			suggestions: [],
		})
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		vscode.window.showErrorMessage(`Failed to create commit message: ${errorMessage}`)
	}
}
