import { Result } from "./Result"
import { M78_CONFIG } from "./m78"
import { HttpClient } from "../HttpClient"

/**
 * M78 服务工具类
 */
export class M78ServiceTool {
	/**
	 * 上传代码信息
	 * @param param 参数
	 * @returns Result<boolean>
	 */
	public static async uploadCodeInfo(param: string): Promise<Result<boolean>> {
		const uploadCodeInfo = M78_CONFIG.CONF_M78_URL + M78_CONFIG.CONF_M78_UPLOAD_CODE_INFO

		console.log(`calling: ${uploadCodeInfo}, param: ${param}`)

		const resp = await HttpClient.callHttpServer(uploadCodeInfo, "uploadCodeInfo", param, false, false, 30)

		const res = JSON.parse(resp) as Result<boolean>
		console.log(`calling: ${uploadCodeInfo}, resCode: ${res.code}`)

		return res
	}
}
