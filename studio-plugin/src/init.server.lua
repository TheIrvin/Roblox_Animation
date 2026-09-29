local UI = require(script.Parent.UI)

assert(plugin, "This script must run as a Roblox Studio plugin.")

local toolbar = plugin:CreateToolbar("Roblox Animator")
local toggleButton = toolbar:CreateButton(
	"RobloxAnimatorToggle",
	"Open the Roblox Animator bridge",
	"",
	"Animator"
)
toggleButton.ClickableWhenViewportHidden = true

local widget = UI.create(plugin)
toggleButton.Click:Connect(function()
	widget.Enabled = not widget.Enabled
end)
