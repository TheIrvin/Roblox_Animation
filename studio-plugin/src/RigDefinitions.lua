local RigDefinitions = {}

RigDefinitions.Trees = {
	R6 = {
		name = "HumanoidRootPart",
		children = {
			{
				name = "Torso",
				children = {
					{ name = "Head" },
					{ name = "Left Arm" },
					{ name = "Right Arm" },
					{ name = "Left Leg" },
					{ name = "Right Leg" },
				},
			},
		},
	},
	R15 = {
		name = "HumanoidRootPart",
		children = {
			{
				name = "LowerTorso",
				children = {
					{
						name = "UpperTorso",
						children = {
							{ name = "Head" },
							{
								name = "LeftUpperArm",
								children = {
									{
										name = "LeftLowerArm",
										children = { { name = "LeftHand" } },
									},
								},
							},
							{
								name = "RightUpperArm",
								children = {
									{
										name = "RightLowerArm",
										children = { { name = "RightHand" } },
									},
								},
							},
						},
					},
					{
						name = "LeftUpperLeg",
						children = {
							{
								name = "LeftLowerLeg",
								children = { { name = "LeftFoot" } },
							},
						},
					},
					{
						name = "RightUpperLeg",
						children = {
							{
								name = "RightLowerLeg",
									children = { { name = "RightFoot" } },
							},
						},
					},
				},
			},
		},
	},
}

function RigDefinitions.GetJointIds(rig)
	local tree = RigDefinitions.Trees[rig]
	if not tree then
		return nil
	end
	local ids = {}
	local function visit(node)
		table.insert(ids, node.name)
		for _, child in ipairs(node.children or {}) do
			visit(child)
		end
	end
	visit(tree)
	return ids
end

return RigDefinitions
