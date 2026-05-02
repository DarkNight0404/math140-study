import { graph_from_banwa, graph_from_dorm_as, operatingCost } from "./graph.js";

function pickGraph(start) {
  return start === "A" || start === "M" ? graph_from_dorm_as : graph_from_banwa;
}

function permutations(arr) {
  if (arr.length <= 1) return [arr.slice()];
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = arr.slice(0, i).concat(arr.slice(i + 1));
    for (const p of permutations(rest)) out.push([arr[i], ...p]);
  }
  return out;
}

//dijkstra that returns both distance and the actual path
export function dijkstraWithPath(start, end) {
  const graph = pickGraph(start);

  const dist = {};
  const prev = {};
  for (const node of Object.keys(graph)) {
    dist[node] = Infinity;
    prev[node] = null;
  }
  dist[start] = 0;

  const pq = [{ d: 0, node: start }];

  while (pq.length) {
    pq.sort((a, b) => a.d - b.d);
    const { d, node } = pq.shift();

    if (d > dist[node]) continue;
    if (node === end) break;

    for (const [nbr, w] of graph[node] ?? []) {
      const nd = d + w;
      if (nd < dist[nbr]) {
        dist[nbr] = nd;
        prev[nbr] = node;
        pq.push({ d: nd, node: nbr });
      }
    }
  }

  if (!Number.isFinite(dist[end])) {
    return { distance: Infinity, path: [] };
  }

  // reconstruct path end -> start using prev[]
  const path = [];
  let cur = end;
  while (cur !== null) {
    path.push(cur);
    if (cur === start) break;
    cur = prev[cur];
  }
  path.reverse();

  // if we never reached start, then no valid path
  if (path[0] !== start) return { distance: Infinity, path: [] };

  return { distance: dist[end], path };
}

export function computeEfficientRoute(startingTerminal, dropOffs) {
  const routes = permutations(dropOffs).map((p) => [startingTerminal, ...p]);

  let efficientRoute = null;
  let efficientDistance = Infinity;

  for (const route of routes) {
    let distance = 0;

    for (let i = 1; i < route.length; i++) {
      const { distance: legDist } = dijkstraWithPath(route[i - 1], route[i]);
      distance += legDist;
    }

    if (distance < efficientDistance) {
      efficientDistance = distance;
      efficientRoute = route;
    }
  }

  // choose nearest terminal at the end
  const terminals = ["A", "M", "S"];
  const last = efficientRoute[efficientRoute.length - 1];

  let nearestTerminal = terminals[0];
  let nearestDistance = dijkstraWithPath(last, terminals[0]).distance;

  for (const t of terminals) {
    const d = dijkstraWithPath(last, t).distance;
    if (d < nearestDistance) {
      nearestDistance = d;
      nearestTerminal = t;
    }
  }

  const finalRoute = [...efficientRoute, nearestTerminal];
  const totalDistance = efficientDistance + nearestDistance;
  const cost = totalDistance * operatingCost;

  //build the per-leg shortest path details
  const legs = [];
  for (let i = 1; i < finalRoute.length; i++) {
    const from = finalRoute[i - 1];
    const to = finalRoute[i];
    const { distance, path } = dijkstraWithPath(from, to);
    legs.push({ from, to, distance, path });
  }

  return {
    finalRoute,
    legs, // prints in UI
    totalDistance,
    cost,
    start: finalRoute[0],
    end: finalRoute[finalRoute.length - 1],
  };
}