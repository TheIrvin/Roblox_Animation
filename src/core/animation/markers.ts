export interface AnimationMarker {
  readonly id: string;
  readonly frame: number;
  readonly name: string;
  readonly value?: string;
}

function validateFrame(frame: number, durationFrames: number): void {
  if (
    !Number.isSafeInteger(durationFrames) ||
    durationFrames < 1 ||
    !Number.isSafeInteger(frame) ||
    frame < 0 ||
    frame > durationFrames
  )
    throw new RangeError(
      "Marker frame must be an integer within the animation duration.",
    );
}

function validateName(name: string): string {
  const normalized = name.trim();
  if (!normalized) throw new RangeError("Marker name cannot be empty.");
  if (normalized.length > 64)
    throw new RangeError("Marker name cannot exceed 64 characters.");
  return normalized;
}

export function addMarker(
  markers: readonly AnimationMarker[],
  marker: AnimationMarker,
  durationFrames: number,
): AnimationMarker[] {
  if (!marker.id.trim()) throw new RangeError("Marker id cannot be empty.");
  if (markers.some((candidate) => candidate.id === marker.id))
    throw new RangeError(`Marker id ${marker.id} already exists.`);
  validateFrame(marker.frame, durationFrames);
  const normalized = { ...marker, name: validateName(marker.name) };
  return [...markers, normalized].sort(
    (left, right) => left.frame - right.frame || left.id.localeCompare(right.id),
  );
}

export function renameMarker(
  markers: readonly AnimationMarker[],
  markerId: string,
  name: string,
): AnimationMarker[] {
  const marker = markers.find((candidate) => candidate.id === markerId);
  if (!marker) throw new RangeError(`Marker ${markerId} does not exist.`);
  const normalized = validateName(name);
  return markers.map((candidate) =>
    candidate.id === markerId ? { ...candidate, name: normalized } : candidate,
  );
}

export function moveMarker(
  markers: readonly AnimationMarker[],
  markerId: string,
  frame: number,
  durationFrames: number,
): AnimationMarker[] {
  const marker = markers.find((candidate) => candidate.id === markerId);
  if (!marker) throw new RangeError(`Marker ${markerId} does not exist.`);
  validateFrame(frame, durationFrames);
  return markers
    .map((candidate) => (candidate.id === markerId ? { ...candidate, frame } : candidate))
    .sort((left, right) => left.frame - right.frame || left.id.localeCompare(right.id));
}

export function deleteMarker(
  markers: readonly AnimationMarker[],
  markerId: string,
): AnimationMarker[] {
  return markers.filter((marker) => marker.id !== markerId);
}

export function maximumMarkerFrame(markers: readonly AnimationMarker[]): number {
  return markers.reduce((maximum, marker) => Math.max(maximum, marker.frame), 0);
}
