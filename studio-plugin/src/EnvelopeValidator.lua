local EnvelopeValidator = {}
local MAX_BYTES = 5 * 1024 * 1024
local VALID_STYLES = {
	Linear = true,
	Constant = true,
	Elastic = true,
	Cubic = true,
	Bounce = true,
	CubicV2 = true,
}
local VALID_DIRECTIONS = { In = true, Out = true, InOut = true }
local VALID_PRIORITIES = {
	Core = true,
	Idle = true,
	Movement = true,
	Action = true,
	Action2 = true,
	Action3 = true,
	Action4 = true,
}

local function fail(message)
	return false, message
end

local function finite(value)
	return type(value) == "number" and value == value and value ~= math.huge and value ~= -math.huge
end

local function integer(value, minimum)
	return finite(value) and value % 1 == 0 and value >= minimum
end

local function nonEmptyString(value)
	return type(value) == "string" and value:match("%S") ~= nil
end

local function isArray(value)
	if type(value) ~= "table" then
		return false
	end
	local count = 0
	for key in pairs(value) do
		if type(key) ~= "number" or key < 1 or key % 1 ~= 0 then
			return false
		end
		count += 1
	end
	return count == #value
end

local function validateMarker(marker, frameNumber, seenIds)
	if type(marker) ~= "table" then
		return fail("Frame marker must be an object.")
	end
	if not nonEmptyString(marker.id) or #marker.id > 128 then
		return fail("Marker ID must be a non-empty string of at most 128 characters.")
	end
	if seenIds[marker.id] then
		return fail("Marker IDs must be unique across the export.")
	end
	seenIds[marker.id] = true
	if not nonEmptyString(marker.name) or #marker.name > 64 then
		return fail("Marker name must contain 1 to 64 characters.")
	end
	if marker.frame ~= frameNumber then
		return fail("Marker frame must match its containing keyframe.")
	end
	if marker.value ~= nil and type(marker.value) ~= "string" then
		return fail("Marker value must be a string when present.")
	end
	return true
end

local function validatePose(pose, validJointIds, seenJointIds)
	if type(pose) ~= "table" then
		return fail("Frame pose must be an object.")
	end
	if type(pose.jointId) ~= "string" or not validJointIds[pose.jointId] then
		return fail("Frame contains an unknown rig joint.")
	end
	if seenJointIds[pose.jointId] then
		return fail("Frame contains a duplicate joint pose.")
	end
	seenJointIds[pose.jointId] = true
	if not isArray(pose.position) or #pose.position ~= 3 then
		return fail("Pose position must be a three-number array.")
	end
	for _, value in ipairs(pose.position) do
		if not finite(value) then
			return fail("Pose position must contain only finite numbers.")
		end
	end
	if not isArray(pose.rotation) or #pose.rotation ~= 4 then
		return fail("Pose rotation must be a four-number quaternion array.")
	end
	local magnitudeSquared = 0
	for _, value in ipairs(pose.rotation) do
		if not finite(value) then
			return fail("Pose quaternion must contain only finite numbers.")
		end
		magnitudeSquared += value * value
	end
	if magnitudeSquared < 1e-24 then
		return fail("Pose quaternion must have non-zero magnitude.")
	end
	if type(pose.easing) ~= "table"
		or not VALID_STYLES[pose.easing.style]
		or not VALID_DIRECTIONS[pose.easing.direction]
	then
		return fail("Pose easing style or direction is unsupported.")
	end
	return true
end

local function validateTrack(track, jointId, validJointIds, durationFrames)
	if not validJointIds[jointId] or type(track) ~= "table" or track.jointId ~= jointId
		or not isArray(track.keyframes) or #track.keyframes == 0
	then
		return fail("Project contains an invalid joint track.")
	end
	local previousFrame = -1
	for _, keyframe in ipairs(track.keyframes) do
		if type(keyframe) ~= "table" or not integer(keyframe.frame, 0)
			or keyframe.frame > durationFrames or keyframe.frame <= previousFrame
		then
			return fail("Project track keyframes must be unique and sorted within the duration.")
		end
		previousFrame = keyframe.frame
		local transform = keyframe.transform
		if type(transform) ~= "table" or not isArray(transform.position)
			or #transform.position ~= 3 or not isArray(transform.rotation) or #transform.rotation ~= 4
		then
			return fail("Project track transform has an invalid position or quaternion.")
		end
		for _, value in ipairs(transform.position) do
			if not finite(value) then
				return fail("Project track position must contain only finite numbers.")
			end
		end
		local magnitudeSquared = 0
		for _, value in ipairs(transform.rotation) do
			if not finite(value) then
				return fail("Project track quaternion must contain only finite numbers.")
			end
			magnitudeSquared += value * value
		end
		if magnitudeSquared < 1e-24 then
			return fail("Project track quaternion must have non-zero magnitude.")
		end
		if type(keyframe.easing) ~= "table" or not VALID_STYLES[keyframe.easing.style]
			or not VALID_DIRECTIONS[keyframe.easing.direction]
		then
			return fail("Project track easing style or direction is unsupported.")
		end
	end
	return true
end

function EnvelopeValidator.Validate(envelope, encodedBytes, rigDefinitions)
	if encodedBytes ~= nil and (not integer(encodedBytes, 0) or encodedBytes > MAX_BYTES) then
		return fail("Export payload exceeds the 5 MB size limit.")
	end
	if type(envelope) ~= "table" or envelope.protocolVersion ~= 1 then
		return fail("Export payload must use protocol version 1.")
	end
	if not nonEmptyString(envelope.exportId) or not envelope.exportId:match("^[%w%-_]+$") then
		return fail("Export ID contains unsupported characters.")
	end
	if not nonEmptyString(envelope.createdAt) then
		return fail("Export timestamp is missing.")
	end
	local project = envelope.project
	if type(project) ~= "table" or project.schemaVersion ~= 1 then
		return fail("Export project must use schema version 1.")
	end
	if type(project.app) ~= "table" or project.app.name ~= "Roblox Animator Desktop"
		or not nonEmptyString(project.app.createdWith)
	then
		return fail("Export project app metadata is invalid.")
	end
	local metadata = project.project
	if type(metadata) ~= "table" or not nonEmptyString(metadata.id)
		or not nonEmptyString(metadata.name) or #metadata.name > 128
	then
		return fail("Export project metadata is invalid.")
	end
	local rig = metadata.rig
	local jointIds = rigDefinitions and rigDefinitions.GetJointIds(rig)
	if not jointIds then
		return fail("Export rig must be R6 or R15.")
	end
	if not integer(metadata.fps, 1) or metadata.fps > 240 then
		return fail("Export FPS must be an integer from 1 to 240.")
	end
	if not integer(metadata.durationFrames, 1) or type(metadata.loop) ~= "boolean"
		or not VALID_PRIORITIES[metadata.priority]
	then
		return fail("Export duration, loop, or priority metadata is invalid.")
	end
	if type(project.tracks) ~= "table" or not isArray(project.markers) then
		return fail("Export project tracks or markers are invalid.")
	end
	if not isArray(envelope.frames) or #envelope.frames == 0 then
		return fail("Export must contain at least one frame.")
	end

	local validJointIds = {}
	for _, jointId in ipairs(jointIds) do
		validJointIds[jointId] = true
	end
	local seenMarkerIds = {}
	local projectMarkersById = {}
	local expectedFrames = { [0] = true }
	for jointId, track in pairs(project.tracks) do
		local valid, message = validateTrack(track, jointId, validJointIds, metadata.durationFrames)
		if not valid then
			return fail(message)
		end
		for _, keyframe in ipairs(track.keyframes) do
			expectedFrames[keyframe.frame] = true
		end
	end
	for _, marker in ipairs(project.markers) do
		if type(marker) ~= "table" or not nonEmptyString(marker.id) then
			return fail("Project marker metadata is invalid.")
		end
		if projectMarkersById[marker.id] then
			return fail("Project marker IDs must be unique.")
		end
		projectMarkersById[marker.id] = marker
		if not integer(marker.frame, 0) or marker.frame > metadata.durationFrames
			or not nonEmptyString(marker.name) or #marker.name > 64
			or (marker.value ~= nil and type(marker.value) ~= "string")
		then
			return fail("Project marker metadata is invalid.")
		end
		expectedFrames[marker.frame] = true
	end

	local previousFrame = -1
	for index, frame in ipairs(envelope.frames) do
		if type(frame) ~= "table" or not integer(frame.frame, 0)
			or frame.frame > metadata.durationFrames or frame.frame <= previousFrame
		then
			return fail("Export frames must be unique and sorted within the project duration.")
		end
		if index == 1 and frame.frame ~= 0 then
			return fail("Export must begin with a frame at time zero.")
		end
		if not expectedFrames[frame.frame] then
			return fail("Export contains a frame that is absent from project keyframes and markers.")
		end
		expectedFrames[frame.frame] = nil
		previousFrame = frame.frame
		local expectedTime = frame.frame / metadata.fps
		if not finite(frame.timeSeconds) or math.abs(frame.timeSeconds - expectedTime) > 1e-6 then
			return fail("Export frame time does not match frame number and FPS.")
		end
		if not isArray(frame.poses) or #frame.poses ~= #jointIds then
			return fail("Every exported frame must contain one pose for every rig joint.")
		end
		local seenJointIds = {}
		for _, pose in ipairs(frame.poses) do
			local valid, message = validatePose(pose, validJointIds, seenJointIds)
			if not valid then
				return fail(message)
			end
		end
		for _, jointId in ipairs(jointIds) do
			if not seenJointIds[jointId] then
				return fail("Export frame is missing pose for joint " .. jointId .. ".")
			end
		end
		if not isArray(frame.markers) then
			return fail("Frame markers must be an array.")
		end
		for _, marker in ipairs(frame.markers) do
			local valid, message = validateMarker(marker, frame.frame, seenMarkerIds)
			if not valid then
				return fail(message)
			end
			local source = projectMarkersById[marker.id]
			if not source or source.name ~= marker.name or source.value ~= marker.value
				or source.frame ~= marker.frame
			then
				return fail("Export marker does not match the source project marker.")
			end
		end
	end
	if next(expectedFrames) ~= nil then
		return fail("Export is missing one or more project keyframe times.")
	end
	local exportedMarkerCount = 0
	for _ in pairs(seenMarkerIds) do
		exportedMarkerCount += 1
	end
	if exportedMarkerCount ~= #project.markers then
		return fail("Export markers do not match the project markers.")
	end
	return true
end

return EnvelopeValidator
