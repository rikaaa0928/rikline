import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import React from "react"

interface ProxySettingProps {
	httpProxy: string | undefined
	setHttpProxy: (proxyUrl: string) => void
}

const ProxySetting: React.FC<ProxySettingProps> = ({ httpProxy, setHttpProxy }) => {
	return (
		<div className="mb-4">
			<label htmlFor="http-proxy-input" className="block mb-1 text-sm font-medium">
				HTTP Proxy
			</label>
			<VSCodeTextField
				id="http-proxy-input"
				value={httpProxy || ""}
				onInput={(e: any) => {
					setHttpProxy(e.target.value)
				}}
				placeholder="e.g., http://localhost:8888"
				style={{ width: "100%" }}
			/>
			<p className="text-xs text-[var(--vscode-descriptionForeground)] mt-1">
				Enter the full HTTP proxy URL. This will set the <code>HTTP_PROXY</code> and <code>HTTPS_PROXY</code> environment
				variables for the extension.
			</p>
		</div>
	)
}

export default React.memo(ProxySetting)
