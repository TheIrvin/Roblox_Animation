local RigDefinitions = require(script.Parent:WaitForChild("RigDefinitions"))

local RigValidator = {}

local REQUIRED_PARTS = {
	R6 = { "HumanoidRootPart", "Head", "Torso", "Left Arm", "Right Arm", "Left Leg", "Right Leg" },
	R15 = {
		"HumanoidRootPart", "Head", "LowerTorso", "UpperTorso",
		"LeftUpperArm", "LeftLowerArm", "LeftHand", "RightUpperArm", "RightLowerArm", "RightHand",
		"LeftUpperLeg", "LeftLowerLeg", "LeftFoot", "RightUpperLeg", "RightLowerLeg", "RightFoot",
	},
}

local function containsPart(model, name)
	local part = model:FindFirstChild(name, true)
	return part ~= nil and part:IsA("BasePart")
end

local function modelFromSelection(selection)
	for _, selected in ipairs(selection) do
		local candidate = selected
		if not candidate:IsA("Model") then
			candidate = candidate:FindFirstAncestorOfClass("Model")
		end
		while candidate do
			if candidate:FindFirstChildOfClass("Humanoid") then
				return candidate
			end
			candidate = candidate.Parent
			if candidate and not candidate:IsA("Model") then
				candidate = candidate:FindFirstAncestorOfClass("Model")
			end
		end
	end
	return nil
end

function RigValidator.ValidateSelection(selection)
	local model = modelFromSelection(selection)
	if not model then
		return false, "Select a Roblox R6 or R15 rig model first."
	end
	local humanoid = model:FindFirstChildOfClass("Humanoid")
	local rig = humanoid.RigType == Enum.HumanoidRigType.R6 and "R6"
		or humanoid.RigType == Enum.HumanoidRigType.R15 and "R15"
		or nil
	if not rig then
		return false, "Selected model uses an unsupported humanoid rig type."
	end
	local missing = {}
	for _, partName in ipairs(REQUIRED_PARTS[rig]) do
		if not containsPart(model, partName) then
			table.insert(missing, partName)
		end
	end
	if #missing > 0 then
		return false, string.format("Missing %s parts: %s", rig, table.concat(missing, ", "))
	end
	return true, string.format("Compatible %s rig: %s", rig, model.Name), rig
end

function RigValidator.GetRequiredParts(rig)
	return REQUIRED_PARTS[rig]
end

function RigValidator.GetJointIds(rig)
	return RigDefinitions.GetJointIds(rig)
end

return RigValidator
