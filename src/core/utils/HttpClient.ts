import axios from "axios"

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
	 * @returns 响应字符串
	 */
	public static async callHttpServer(
		url: string,
		method: string,
		param: string,
		useFormData: boolean = false,
		useMultipart: boolean = false,
		timeoutSeconds: number = 30,
	): Promise<string> {
		const headers: Record<string, string> = {
			"Content-Type": useMultipart
				? "multipart/form-data"
				: useFormData
					? "application/x-www-form-urlencoded"
					: "application/json",
		}

		try {
			const response = await axios({
				method: "post",
				url,
				data: param,
				headers,
				timeout: timeoutSeconds * 1000,
			})

			return JSON.stringify(response.data)
		} catch (error) {
			if (axios.isAxiosError(error)) {
				throw new Error(`HTTP request failed: ${error.message}`)
			}
			throw error
		}
	}
}
