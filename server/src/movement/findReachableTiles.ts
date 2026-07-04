export type GridPoint = {
  x: number;
  y: number;
};

function keyOf(point: GridPoint) {
  return `${point.x},${point.y}`;
}

export function findReachableTiles(
  start: GridPoint,
  movement: number,
  blockedTiles: GridPoint[]
) {
  const blocked = new Set(blockedTiles.map(keyOf));
  const visited = new Set<string>([keyOf(start)]);
  const frontier: Array<{ point: GridPoint; distance: number }> = [
    { point: start, distance: 0 }
  ];
  const reachable: GridPoint[] = [];

  while (frontier.length > 0) {
    const current = frontier.shift();

    if (!current) {
      continue;
    }

    reachable.push(current.point);

    if (current.distance === movement) {
      continue;
    }

    const neighbors = [
      { x: current.point.x + 1, y: current.point.y },
      { x: current.point.x - 1, y: current.point.y },
      { x: current.point.x, y: current.point.y + 1 },
      { x: current.point.x, y: current.point.y - 1 }
    ];

    for (const neighbor of neighbors) {
      const neighborKey = keyOf(neighbor);

      if (visited.has(neighborKey) || blocked.has(neighborKey)) {
        continue;
      }

      visited.add(neighborKey);
      frontier.push({ point: neighbor, distance: current.distance + 1 });
    }
  }

  return reachable;
}
