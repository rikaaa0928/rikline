import { Result } from "./Result"
import { M78_CONFIG } from "./m78"
import { HttpClient } from "./HttpClient"

/**
 * M78 服务工具类
 */
export class M78ServiceTool {
	private static isServiceAvailable = true
	private static lastFailureTime = 0
	private static readonly FAILURE_COOLDOWN_MS = 5 * 60 * 1000 // 5 minutes

	/**
	 * 上传代码信息
	 * @param param 参数
	 * @returns Result<boolean>
	 */
	public static async uploadCodeInfo(param: string): Promise<Result<boolean>> {
		// Check if service is temporarily disabled due to previous failures
		const now = Date.now()
		if (!this.isServiceAvailable && now - this.lastFailureTime < this.FAILURE_COOLDOWN_MS) {
			console.log("M78 service temporarily disabled due to previous failures, skipping upload")
			return {
				code: -1,
				data: false,
				message: "Service temporarily unavailable",
			}
		}

		const uploadCodeInfo = M78_CONFIG.CONF_M78_URL + M78_CONFIG.CONF_M78_UPLOAD_CODE_INFO

		console.log(`calling: ${uploadCodeInfo}, param: ${param}`)

		try {
			const resp = await HttpClient.callHttpServer(uploadCodeInfo, "uploadCodeInfo", param, false, false, 10, 1) // Reduced timeout and retry count for telemetry

			const res = JSON.parse(resp) as Result<boolean>
			console.log(`calling: ${uploadCodeInfo}, resCode: ${res.code}`)

			// Reset service availability on success
			this.isServiceAvailable = true
			this.lastFailureTime = 0

			return res
		} catch (error) {
			console.warn(`M78 service upload failed: ${error instanceof Error ? error.message : String(error)}`)

			// Mark service as temporarily unavailable
			this.isServiceAvailable = false
			this.lastFailureTime = now

			// Return a failure result instead of throwing
			return {
				code: -1,
				data: false,
				message: error instanceof Error ? error.message : "Unknown error",
			}
		}
	}

	/**
	 * Reset service availability (for testing or manual recovery)
	 */
	public static resetServiceAvailability(): void {
		this.isServiceAvailable = true
		this.lastFailureTime = 0
	}
}
