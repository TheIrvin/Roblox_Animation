local BridgeClient = require(script.Parent.BridgeClient)

local UI = {}

local function makeLabel(parent, name, text, position, size)
	local label = Instance.new("TextLabel")
	label.Name = name
	label.BackgroundTransparency = 1
	label.Font = Enum.Font.SourceSans
	label.Text = text
	label.TextColor3 = Color3.fromRGB(220, 226, 239)
	label.TextSize = 14
	label.TextXAlignment = Enum.TextXAlignment.Left
	label.Position = position
	label.Size = size
	label.Parent = parent
	return label
end

local function makeButton(parent, name, text, position, size)
	local button = Instance.new("TextButton")
	button.Name = name
	button.BackgroundColor3 = Color3.fromRGB(55, 77, 132)
	button.BorderSizePixel = 0
	button.Font = Enum.Font.SourceSansSemibold
	button.Text = text
	button.TextColor3 = Color3.fromRGB(245, 247, 255)
	button.TextSize = 14
	button.Position = position
	button.Size = size
	button.Parent = parent
	return button
end

function UI.create(plugin)
	local info = DockWidgetPluginGuiInfo.new(
		Enum.InitialDockState.Right,
		true,
		false,
		330,
		260,
		280,
		220
	)
	local widget = plugin:CreateDockWidgetPluginGuiAsync("RobloxAnimatorBridge", info)
	widget.Title = "Roblox Animator"

	local root = Instance.new("Frame")
	root.Name = "Root"
	root.BackgroundColor3 = Color3.fromRGB(27, 31, 42)
	root.BorderSizePixel = 0
	root.Size = UDim2.fromScale(1, 1)
	root.Parent = widget

	local padding = Instance.new("UIPadding")
	padding.PaddingTop = UDim.new(0, 14)
	padding.PaddingBottom = UDim.new(0, 12)
	padding.PaddingLeft = UDim.new(0, 14)
	padding.PaddingRight = UDim.new(0, 14)
	padding.Parent = root

	makeLabel(root, "Host", "Host  127.0.0.1", UDim2.fromOffset(0, 0), UDim2.new(1, 0, 0, 22))
	makeLabel(root, "PortLabel", "Port", UDim2.fromOffset(0, 30), UDim2.fromOffset(58, 26))
	local portBox = Instance.new("TextBox")
	portBox.Name = "Port"
	portBox.BackgroundColor3 = Color3.fromRGB(40, 45, 59)
	portBox.BorderSizePixel = 0
	portBox.ClearTextOnFocus = false
	portBox.Font = Enum.Font.Code
	portBox.Text = tostring(plugin:GetSetting("bridgePort") or 38472)
	portBox.TextColor3 = Color3.fromRGB(238, 241, 248)
	portBox.TextSize = 14
	portBox.Position = UDim2.fromOffset(60, 30)
	portBox.Size = UDim2.new(1, -60, 0, 26)
	portBox.Parent = root

	local status = makeLabel(
		root,
		"Status",
		"Desktop: checking...",
		UDim2.fromOffset(0, 66),
		UDim2.new(1, 0, 0, 44)
	)
	status.TextWrapped = true
	status.TextYAlignment = Enum.TextYAlignment.Top

	local checkButton = makeButton(
		root,
		"CheckConnection",
		"Check Connection",
		UDim2.fromOffset(0, 116),
		UDim2.new(1, 0, 0, 32)
	)
	local importButton = makeButton(
		root,
		"ImportLatest",
		"Import Latest",
		UDim2.fromOffset(0, 156),
		UDim2.new(1, 0, 0, 36)
	)
	makeLabel(
		root,
		"ImportNote",
		"Phase 13 will build the KeyframeSequence.",
		UDim2.fromOffset(0, 202),
		UDim2.new(1, 0, 0, 22)
	).TextColor3 = Color3.fromRGB(151, 163, 185)

	local function persistPort()
		local port = tonumber(portBox.Text)
		if not port or port % 1 ~= 0 or port < 1 or port > 65535 then
			status.Text = "Port must be an integer from 1 to 65535."
			return false
		end
		portBox.Text = tostring(port)
		plugin:SetSetting("bridgePort", port)
		return true
	end

	portBox.FocusLost:Connect(persistPort)
	checkButton.Activated:Connect(function()
		if not persistPort() then
			return
		end
		status.Text = "Checking desktop bridge..."
		task.spawn(function()
			local connected, message = BridgeClient.CheckHealth(portBox.Text)
			status.Text = connected and ("Desktop: Connected\n" .. message) or ("Desktop: " .. message)
		end)
	end)
	importButton.Activated:Connect(function()
		if not persistPort() then
			return
		end
		status.Text = "Requesting latest export..."
		task.spawn(function()
			local envelope, message = BridgeClient.FetchLatest(portBox.Text)
			if not envelope then
				status.Text = message
				return
			end
			local project = envelope.project.project
			status.Text = string.format(
				"Export ready: %s · %s\n%d frames · %s",
				project.name,
				project.rig,
				#envelope.frames,
				envelope.exportId
			)
		end)
	end)

	task.spawn(function()
		local connected, message = BridgeClient.CheckHealth(portBox.Text)
		status.Text = connected and ("Desktop: Connected\n" .. message) or ("Desktop: " .. message)
	end)
	return widget
end

return UI
