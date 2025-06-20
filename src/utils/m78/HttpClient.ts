import axios, { AxiosError } from "axios"
import * as https from "https"

/**
 * HTTP 客户端工具类
 */
export class HttpClient {
	/**
	 * 调用 HTTP 服务
	 * @param url 请求 URL
	 * @param method 方法名
	 * @param param 参数
	 * @param useFormData 是否使用表单数据
	 * @param useMultipart 是否使用 multipart
	 * @param timeoutSeconds 超时时间（秒）
	 * @param retryCount 重试次数（默认为2）
	 * @returns 响应字符串
	 */
	public static async callHttpServer(
		url: string,
		method: string,
		param: string,
		useFormData: boolean = false,
		useMultipart: boolean = false,
		timeoutSeconds: number = 30,
		retryCount: number = 2,
	): Promise<string> {
		const headers: Record<string, string> = {
			"Content-Type": useMultipart
				? "multipart/form-data"
				: useFormData
					? "application/x-www-form-urlencoded"
					: "application/json",
		}

		// Create HTTPS agent with more lenient TLS settings
		const httpsAgent = new https.Agent({
			rejectUnauthorized: false, // Allow self-signed certificates
			keepAlive: true,
			timeout: timeoutSeconds * 1000,
		})

		let lastError: Error | null = null

		for (let attempt = 0; attempt <= retryCount; attempt++) {
			try {
				const response = await axios({
					method: "post",
					url,
					data: param,
					headers,
					timeout: timeoutSeconds * 1000,
					httpsAgent: url.startsWith("https://") ? httpsAgent : undefined,
					// Additional axios configurations for better stability
					maxRedirects: 5,
					validateStatus: (status) => status < 500, // Don't retry on 4xx errors
				})

				return JSON.stringify(response.data)
			} catch (error) {
				lastError = error as Error

				if (axios.isAxiosError(error)) {
					const axiosError = error as AxiosError

					// Log detailed error information
					console.error(`HTTP request attempt ${attempt + 1} failed:`, {
						url,
						method,
						message: axiosError.message,
						code: axiosError.code,
						status: axiosError.response?.status,
						statusText: axiosError.response?.statusText,
					})

					// Don't retry on certain types of errors
					if (axiosError.response?.status && axiosError.response.status >= 400 && axiosError.response.status < 500) {
						// Client errors (4xx) - don't retry
						throw new Error(
							`HTTP request failed with status ${axiosError.response.status}: ${axiosError.response.statusText}`,
						)
					}

					// For network/connection errors, retry if we haven't exhausted attempts
					if (attempt < retryCount) {
						const delay = Math.min(1000 * Math.pow(2, attempt), 5000) // Exponential backoff, max 5s
						console.log(`Retrying in ${delay}ms... (attempt ${attempt + 1}/${retryCount + 1})`)
						await new Promise((resolve) => setTimeout(resolve, delay))
						continue
					}

					// All retry attempts exhausted
					throw new Error(`HTTP request failed after ${retryCount + 1} attempts: ${axiosError.message}`)
				}

				// Non-axios errors
				if (attempt < retryCount) {
					const delay = Math.min(1000 * Math.pow(2, attempt), 5000)
					console.log(`Retrying in ${delay}ms... (attempt ${attempt + 1}/${retryCount + 1})`)
					await new Promise((resolve) => setTimeout(resolve, delay))
					continue
				}

				throw error
			}
		}

		// This should never be reached, but just in case
		throw lastError || new Error("Request failed for unknown reason")
	}
}
