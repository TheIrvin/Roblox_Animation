local Quaternion = require("../src/Quaternion")
local RigDefinitions = require("../src/RigDefinitions")
local EnvelopeValidator = require("../src/EnvelopeValidator")

local passed = 0
local function test(name, callback)
	local ok, message = pcall(callback)
	if not ok then
		error(string.format("FAIL %s: %s", name, tostring(message)), 0)
	end
	passed += 1
	print("PASS " .. name)
end

local function equal(actual, expected, tolerance)
	assert(math.abs(actual - expected) <= (tolerance or 1e-9), string.format("expected %.12f, got %.12f", expected, actual))
end

local function makePose(jointId)
	return {
		jointId = jointId,
		position = { 0, 0, 0 },
		rotation = { 0, 0, 0, 1 },
		easing = { style = "Cubic", direction = "Out" },
	}
end

local function makeEnvelope(rig)
	local jointIds = RigDefinitions.GetJointIds(rig)
	local frames = {}
	for _, frameNumber in ipairs({ 0, 9, 16, 22 }) do
		local poses = {}
		for _, jointId in ipairs(jointIds) do
			table.insert(poses, makePose(jointId))
		end
		local markers = {}
		if frameNumber == 16 then
			markers = { { id = "throw-rock", frame = 16, name = "THROW", value = "rock" } }
		end
		table.insert(frames, {
			frame = frameNumber,
			timeSeconds = frameNumber / 30,
			poses = poses,
			markers = markers,
		})
	end
	local rootTrack = {
		jointId = "HumanoidRootPart",
		keyframes = {
			{
				frame = 9,
				transform = { position = { 0, 0, 0 }, rotation = { 0, 0, 0, 1 } },
				easing = { style = "Cubic", direction = "Out" },
			},
			{
				frame = 22,
				transform = { position = { 0, 0, 0 }, rotation = { 0, 0, 0, 1 } },
				easing = { style = "Linear", direction = "InOut" },
			},
		},
	}
	return {
		protocolVersion = 1,
		exportId = "phase13-fixture-001",
		createdAt = "2026-01-01T00:00:00.000Z",
		project = {
			schemaVersion = 1,
			app = { name = "Roblox Animator Desktop", createdWith = "0.1.0" },
			project = {
				id = "throw-rock",
				name = "ThrowRock",
				rig = rig,
				fps = 30,
				durationFrames = 22,
				loop = false,
				priority = "Action",
			},
			tracks = { HumanoidRootPart = rootTrack },
			markers = { { id = "throw-rock", frame = 16, name = "THROW", value = "rock" } },
		},
		frames = frames,
	}
end

test("quaternion identity preserves root translation", function()
	local components = assert(Quaternion.Normalize({ 2, 3, 4 }, { 0, 0, 0, 1 }))
	assert(#components == 7)
	equal(components[1], 2)
	equal(components[2], 3)
	equal(components[3], 4)
	equal(components[7], 1)
end)

test("quaternion X +90 degrees is normalized", function()
	local half = math.sqrt(0.5)
	local components = assert(Quaternion.Normalize({ 0, 0, 0 }, { half * 4, 0, 0, half * 4 }))
	equal(components[4], half)
	equal(components[5], 0)
	equal(components[6], 0)
	equal(components[7], half)
end)

test("quaternion Y +90 degrees is normalized", function()
	local half = math.sqrt(0.5)
	local components = assert(Quaternion.Normalize({ 0, 0, 0 }, { 0, half, 0, half }))
	equal(components[4], 0)
	equal(components[5], half)
	equal(components[6], 0)
	equal(components[7], half)
end)

test("quaternion Z +90 degrees is normalized", function()
	local half = math.sqrt(0.5)
	local components = assert(Quaternion.Normalize({ 0, 0, 0 }, { 0, 0, half, half }))
	equal(components[4], 0)
	equal(components[5], 0)
	equal(components[6], half)
	equal(components[7], half)
end)

test("compound quaternion normalizes without Euler conversion", function()
	local components = assert(Quaternion.Normalize({ -3, 5, 7 }, { 1, 2, 3, 4 }))
	local magnitude = math.sqrt(components[4]^2 + components[5]^2 + components[6]^2 + components[7]^2)
	equal(magnitude, 1)
	equal(components[1], -3)
end)

test("zero quaternion is rejected", function()
	local components, message = Quaternion.Normalize({ 0, 0, 0 }, { 0, 0, 0, 0 })
	assert(components == nil and message:find("non%-zero"))
end)

test("ThrowRock R6 full-pose envelope validates", function()
	local valid, message = EnvelopeValidator.Validate(makeEnvelope("R6"), 4096, RigDefinitions)
	assert(valid, message)
end)

test("ThrowRock R15 full-pose envelope validates", function()
	local valid, message = EnvelopeValidator.Validate(makeEnvelope("R15"), 4096, RigDefinitions)
	assert(valid, message)
end)

test("unknown rig is rejected", function()
	local envelope = makeEnvelope("R15")
	envelope.project.project.rig = "R20"
	local valid, message = EnvelopeValidator.Validate(envelope, nil, RigDefinitions)
	assert(not valid and message:find("R6 or R15"))
end)

test("missing full-pose joint is rejected", function()
	local envelope = makeEnvelope("R15")
	table.remove(envelope.frames[2].poses)
	local valid, message = EnvelopeValidator.Validate(envelope, nil, RigDefinitions)
	assert(not valid and message:find("every rig joint"))
end)

test("invalid zero quaternion is rejected", function()
	local envelope = makeEnvelope("R6")
	envelope.frames[1].poses[1].rotation = { 0, 0, 0, 0 }
	local valid, message = EnvelopeValidator.Validate(envelope, nil, RigDefinitions)
	assert(not valid and message:find("non%-zero"))
end)

test("missing marker payload is rejected", function()
	local envelope = makeEnvelope("R15")
	envelope.frames[3].markers = {}
	local valid, message = EnvelopeValidator.Validate(envelope, nil, RigDefinitions)
	assert(not valid and message:find("markers do not match"))
end)

test("oversized export is rejected", function()
	local valid, message = EnvelopeValidator.Validate(makeEnvelope("R6"), 5 * 1024 * 1024 + 1, RigDefinitions)
	assert(not valid and message:find("5 MB"))
end)

print(string.format("%d Phase 13 Luau tests passed.", passed))
