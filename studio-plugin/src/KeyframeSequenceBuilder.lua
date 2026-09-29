local EnvelopeValidator = require(script.Parent:WaitForChild("EnvelopeValidator"))
local Quaternion = require(script.Parent:WaitForChild("Quaternion"))
local RigDefinitions = require(script.Parent:WaitForChild("RigDefinitions"))

local KeyframeSequenceBuilder = {}
local IMPORT_FOLDER_NAME = "RobloxAnimatorImports"
local PRIORITIES = {
	Core = Enum.AnimationPriority.Core,
	Idle = Enum.AnimationPriority.Idle,
	Movement = Enum.AnimationPriority.Movement,
	Action = Enum.AnimationPriority.Action,
	Action2 = Enum.AnimationPriority.Action2,
	Action3 = Enum.AnimationPriority.Action3,
	Action4 = Enum.AnimationPriority.Action4,
}
local EASING_STYLES = {
	Linear = Enum.PoseEasingStyle.Linear,
	Constant = Enum.PoseEasingStyle.Constant,
	Elastic = Enum.PoseEasingStyle.Elastic,
	Cubic = Enum.PoseEasingStyle.Cubic,
	Bounce = Enum.PoseEasingStyle.Bounce,
	CubicV2 = Enum.PoseEasingStyle.CubicV2,
}
local EASING_DIRECTIONS = {
	In = Enum.PoseEasingDirection.In,
	Out = Enum.PoseEasingDirection.Out,
	InOut = Enum.PoseEasingDirection.InOut,
}

local function buildPoseTree(node, posesByJoint)
	local pose = Instance.new("Pose")
	pose.Name = node.name
	pose.CFrame = assert(Quaternion.ToCFrame(
		posesByJoint[node.name].position,
		posesByJoint[node.name].rotation
	))
	pose.Weight = 1
	local easing = posesByJoint[node.name].easing
	pose.EasingStyle = EASING_STYLES[easing.style]
	pose.EasingDirection = EASING_DIRECTIONS[easing.direction]
	for _, childNode in ipairs(node.children or {}) do
		pose:AddSubPose(buildPoseTree(childNode, posesByJoint))
	end
	return pose
end

local function uniqueSequenceName(folder, baseName)
	local candidate = baseName
	local suffix = 2
	while folder:FindFirstChild(candidate) do
		candidate = string.format("%s (%d)", baseName, suffix)
		suffix += 1
	end
	return candidate
end

function KeyframeSequenceBuilder.Validate(envelope, encodedBytes)
	return EnvelopeValidator.Validate(envelope, encodedBytes, RigDefinitions)
end

function KeyframeSequenceBuilder.Build(envelope)
	local valid, message = KeyframeSequenceBuilder.Validate(envelope)
	if not valid then
		error(message, 2)
	end
	local rig = envelope.project.project.rig
	local tree = RigDefinitions.Trees[rig]
	local sequence = Instance.new("KeyframeSequence")
	local ok, buildError = pcall(function()
		sequence.Name = envelope.project.project.name
		sequence.Loop = envelope.project.project.loop
		sequence.Priority = PRIORITIES[envelope.project.project.priority]
		sequence:SetAttribute("RobloxAnimatorExportId", envelope.exportId)
		sequence:SetAttribute("RobloxAnimatorRig", rig)
		sequence:SetAttribute("RobloxAnimatorFPS", envelope.project.project.fps)
		for _, frameData in ipairs(envelope.frames) do
			local posesByJoint = {}
			for _, poseData in ipairs(frameData.poses) do
				posesByJoint[poseData.jointId] = poseData
			end
			local keyframe = Instance.new("Keyframe")
			keyframe.Name = string.format("Frame_%06d", frameData.frame)
			keyframe.Time = frameData.timeSeconds
			keyframe:AddPose(buildPoseTree(tree, posesByJoint))
			for _, markerData in ipairs(frameData.markers) do
				local marker = Instance.new("KeyframeMarker")
				marker.Name = markerData.name
				marker.Value = markerData.value or ""
				keyframe:AddMarker(marker)
			end
			sequence:AddKeyframe(keyframe)
		end
	end)
	if not ok then
		sequence:Destroy()
		error("Could not build KeyframeSequence: " .. tostring(buildError), 2)
	end
	return sequence
end

function KeyframeSequenceBuilder.Import(envelope, serverStorage)
	local sequence = KeyframeSequenceBuilder.Build(envelope)
	local ok, result = pcall(function()
		local folder = serverStorage:FindFirstChild(IMPORT_FOLDER_NAME)
		if folder and not folder:IsA("Folder") then
			error("ServerStorage.RobloxAnimatorImports exists but is not a Folder.")
		end
		if not folder then
			folder = Instance.new("Folder")
			folder.Name = IMPORT_FOLDER_NAME
			folder.Parent = serverStorage
		end
		sequence.Name = uniqueSequenceName(folder, envelope.project.project.name)
		sequence.Parent = folder
		return sequence
	end)
	if not ok then
		sequence:Destroy()
		error("Could not store imported KeyframeSequence: " .. tostring(result), 2)
	end
	return result
end

return KeyframeSequenceBuilder
