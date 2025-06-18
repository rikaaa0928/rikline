import { Anthropic } from "@anthropic-ai/sdk"
import OpenAI from "openai"
import { withRetry } from "../retry"
import { ApiHandlerOptions, ModelInfo, mifyModelInfoSaneDefaults } from "@shared/api"
import { ApiHandler } from "../index"
import { convertToOpenAiMessages } from "../transform/openai-format"
import { ApiStream } from "../transform/stream"
import { convertToR1Format } from "../transform/r1-format"
import type { ChatCompletionReasoningEffort } from "openai/resources/chat/completions"

export class MifyHandler implements ApiHandler {
	private options: ApiHandlerOptions
	private client: OpenAI

	constructor(options: ApiHandlerOptions) {
		this.options = options
		this.client = new OpenAI({
			baseURL: this.options.mifyBaseUrl,
			apiKey: "dummy", // Mify不使用标准的Authorization header
			defaultHeaders: {
				"api-key": this.options.mifyApiKey || "",
			},
		})
	}

	@withRetry()
	async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
		// Mify不需要指定modelId，但OpenAI库需要model参数，使用固定值
		const isR1FormatRequired = this.options.mifyModelInfo?.isR1FormatRequired ?? false

		let openAiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
			{ role: "system", content: systemPrompt },
			...convertToOpenAiMessages(messages),
		]
		let temperature: number | undefined = this.options.mifyModelInfo?.temperature ?? mifyModelInfoSaneDefaults.temperature
		let maxTokens: number | undefined

		if (this.options.mifyModelInfo?.maxTokens && this.options.mifyModelInfo.maxTokens > 0) {
			maxTokens = Number(this.options.mifyModelInfo.maxTokens)
		} else {
			maxTokens = undefined
		}

		if (isR1FormatRequired) {
			openAiMessages = convertToR1Format([{ role: "user", content: systemPrompt }, ...messages])
		}

		const stream = await this.client.chat.completions.create({
			model: "mify-default", // 使用固定的model名称，满足OpenAI库的要求
			messages: openAiMessages,
			temperature,
			max_tokens: maxTokens,
			stream: true,
			stream_options: { include_usage: true },
		})

		for await (const chunk of stream) {
			const delta = chunk.choices[0]?.delta
			if (delta?.content) {
				yield {
					type: "text",
					text: delta.content,
				}
			}

			if (delta && "reasoning_content" in delta && delta.reasoning_content) {
				yield {
					type: "reasoning",
					reasoning: (delta.reasoning_content as string | undefined) || "",
				}
			}

			if (chunk.usage) {
				yield {
					type: "usage",
					inputTokens: chunk.usage.prompt_tokens || 0,
					outputTokens: chunk.usage.completion_tokens || 0,
					// @ts-ignore-next-line
					cacheReadTokens: chunk.usage.prompt_tokens_details?.cached_tokens || 0,
					// @ts-ignore-next-line
					cacheWriteTokens: chunk.usage.prompt_cache_miss_tokens || 0,
				}
			}
		}
	}

	getModel(): { id: string; info: ModelInfo } {
		return {
			id: "mify-default", // 使用固定的模型ID，因为Mify不需要指定具体模型
			info: this.options.mifyModelInfo ?? mifyModelInfoSaneDefaults,
		}
	}
}
