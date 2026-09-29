local Quaternion = {}

local function finite(value)
	return type(value) == "number" and value == value and value ~= math.huge and value ~= -math.huge
end

function Quaternion.Normalize(position, rotation)
	if type(position) ~= "table" or #position ~= 3 then
		return nil, "Pose position must contain three numbers."
	end
	if type(rotation) ~= "table" or #rotation ~= 4 then
		return nil, "Pose rotation must contain four quaternion components."
	end
	for _, value in ipairs(position) do
		if not finite(value) then
			return nil, "Pose position must contain only finite numbers."
		end
	end
	local x, y, z, w = rotation[1], rotation[2], rotation[3], rotation[4]
	if not finite(x) or not finite(y) or not finite(z) or not finite(w) then
		return nil, "Pose quaternion must contain only finite numbers."
	end
	local scale = math.max(math.abs(x), math.abs(y), math.abs(z), math.abs(w))
	if scale < 1e-12 then
		return nil, "Pose quaternion must have non-zero magnitude."
	end
	local sx, sy, sz, sw = x / scale, y / scale, z / scale, w / scale
	local magnitude = math.sqrt(sx * sx + sy * sy + sz * sz + sw * sw)
	return {
		position[1], position[2], position[3],
		sx / magnitude, sy / magnitude, sz / magnitude, sw / magnitude,
	}
end

function Quaternion.ToCFrame(position, rotation)
	local components, message = Quaternion.Normalize(position, rotation)
	if not components then
		return nil, message
	end
	return CFrame.new(
		components[1], components[2], components[3],
		components[4], components[5], components[6], components[7]
	)
end

return Quaternion
