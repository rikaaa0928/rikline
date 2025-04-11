export type SecretKey =
	| "apiKey"
	| "clineApiKey"
	| "openRouterApiKey"
	| "awsAccessKey"
	| "awsSecretKey"
	| "awsSessionToken"
	| "openAiApiKey"
	| "geminiApiKey"
	| "openAiNativeApiKey"
	| "deepSeekApiKey"
	| "requestyApiKey"
	| "togetherApiKey"
	| "qwenApiKey"
	| "doubaoApiKey"
	| "mistralApiKey"
	| "liteLlmApiKey"
	| "authNonce"
	| "asksageApiKey"
	| "xaiApiKey"
	| "sambanovaApiKey"
export type GlobalStateKey =
	| "apiProvider"
	| "apiModelId"
	| "awsRegion"
	| "awsUseCrossRegionInference"
	| "awsBedrockUsePromptCache"
	| "awsBedrockEndpoint"
	| "awsProfile"
	| "awsUseProfile"
	| "vertexProjectId"
	| "vertexRegion"
	| "vertexBaseUrl"
	| "vertexCredentialsPath"
	| "lastShownAnnouncementId"
	| "customInstructions"
	| "taskHistory"
	| "openAiBaseUrl"
	| "openAiModelId"
	| "openAiModelInfo"
	| "ollamaModelId"
	| "ollamaBaseUrl"
	| "ollamaApiOptionsCtxNum"
	| "lmStudioModelId"
	| "lmStudioBaseUrl"
	| "anthropicBaseUrl"
	| "azureApiVersion"
	| "openRouterModelId"
	| "openRouterModelInfo"
	| "openRouterProviderSorting"
	| "openRouterBaseUrl"
	| "autoApprovalSettings"
	| "browserSettings"
	| "chatSettings"
	| "vsCodeLmModelSelector"
	| "userInfo"
	| "previousModeApiProvider"
	| "previousModeModelId"
	| "previousModeThinkingBudgetTokens"
	| "previousModeVsCodeLmModelSelector"
	| "previousModeModelInfo"
	| "liteLlmBaseUrl"
	| "liteLlmModelId"
	| "liteLlmUsePromptCache"
	| "qwenApiLine"
	| "requestyModelId"
	| "togetherModelId"
	| "mcpMarketplaceCatalog"
	| "telemetrySetting"
	| "asksageApiUrl"
	| "xaiBaseUrl"
	| "thinkingBudgetTokens"
	| "planActSeparateModelsSetting"
	| "favoritedModelIds"
	| "geminiBaseUrl"
