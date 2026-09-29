local PoseWeights = {}

-- Only project tracks should take control of a joint. The export envelope
-- contains identity poses for every rig joint, but those placeholders must
-- not mask lower-priority locomotion animations.
function PoseWeights.FromTracks(tracks)
	local weights = {}
	for jointId, track in pairs(tracks or {}) do
		if type(track) == "table" and type(track.keyframes) == "table" and #track.keyframes > 0 then
			weights[jointId] = 1
		end
	end
	return weights
end

return PoseWeights
