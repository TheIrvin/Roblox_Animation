local HttpService = game:GetService("HttpService")

local BridgeClient = {}
local HOST = "127.0.0.1"
local MAX_EXPORT_BYTES = 5 * 1024 * 1024

local function baseUrl(port)
	local numericPort = tonumber(port)
	if not numericPort or numericPort % 1 ~= 0 or numericPort < 1 or numericPort > 65535 then
		return nil, "Port must be an integer from 1 to 65535."
	end
	return string.format("http://%s:%d", HOST, numericPort)
end

local function getJson(url)
	local ok, response = pcall(function()
		return HttpService:RequestAsync({
			Url = url,
			Method = "GET",
		})
	end)
	if not ok then
		return nil, "Roblox Studio could not reach the desktop bridge. Allow this plugin to access localhost and retry."
	end
	return response
end

function BridgeClient.CheckHealth(port)
	local url, urlError = baseUrl(port)
	if not url then
		return false, urlError
	end

	local response, requestError = getJson(url .. "/health")
	if not response then
		return false, requestError
	end
	if not response.Success then
		return false, string.format("Bridge returned HTTP %d.", response.StatusCode)
	end

	local ok, payload = pcall(function()
		return HttpService:JSONDecode(response.Body)
	end)
	if not ok or payload.protocolVersion ~= 1 or payload.status ~= "ok" then
		return false, "The desktop bridge returned an unsupported health response."
	end
	return true, "Connected to Roblox Animator Desktop."
end

function BridgeClient.FetchLatest(port)
	local url, urlError = baseUrl(port)
	if not url then
		return nil, urlError
	end

	local response, requestError = getJson(url .. "/api/v1/exports/latest")
	if not response then
		return nil, requestError
	end
	if response.StatusCode == 204 then
		return nil, "No prepared export is available."
	end
	if not response.Success then
		return nil, string.format("Bridge returned HTTP %d.", response.StatusCode)
	end
	if #response.Body > MAX_EXPORT_BYTES then
		return nil, "Export payload exceeds the 5 MB size limit."
	end

	local ok, envelope = pcall(function()
		return HttpService:JSONDecode(response.Body)
	end)
	if not ok
		or envelope.protocolVersion ~= 1
		or type(envelope.exportId) ~= "string"
		or type(envelope.project) ~= "table"
		or type(envelope.project.project) ~= "table"
		or type(envelope.frames) ~= "table"
	then
		return nil, "The latest export is not a valid ExportEnvelopeV1."
	end
	if envelope.project.project.rig ~= "R6" and envelope.project.project.rig ~= "R15" then
		return nil, "The export uses an unsupported rig."
	end
	return envelope
end

function BridgeClient.Acknowledge(port, exportId, status, message)
	local url, urlError = baseUrl(port)
	if not url then
		return false, urlError
	end
	if type(exportId) ~= "string" or not exportId:match("^[%w%-_]+$") then
		return false, "Export ID contains unsupported characters."
	end
	if status ~= "imported" and status ~= "rejected" and status ~= "error" then
		return false, "Unsupported import acknowledgement status."
	end
	local ok, response = pcall(function()
		return HttpService:RequestAsync({
			Url = url .. "/api/v1/exports/" .. exportId .. "/ack",
			Method = "POST",
			Headers = { ["Content-Type"] = "application/json" },
			Body = HttpService:JSONEncode({
				status = status,
				message = string.sub(tostring(message or ""), 1, 512),
			}),
		})
	end)
	if not ok then
		return false, "Roblox Studio could not send the import acknowledgement."
	end
	if not response.Success and response.StatusCode ~= 204 then
		return false, string.format("Bridge rejected the import acknowledgement (HTTP %d).", response.StatusCode)
	end
	return true
end

return BridgeClient
