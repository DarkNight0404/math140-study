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

export function dijkstra(start, end) {
  const graph = pickGraph(start);

  const dist = {};
  for (const node of Object.keys(graph)) dist[node] = Infinity;
  dist[start] = 0;

  // priority queue (small inputs => simple array is ok)
  const pq = [{ d: 0, node: start }];

  while (pq.length) {
    pq.sort((a, b) => a.d - b.d);
    const { d, node } = pq.shift();

    if (node === end) return d;
    if (d > dist[node]) continue;

    const neighbors = graph[node] ?? [];
    for (const [nbr, w] of neighbors) {
      const nd = d + w;
      if (nd < dist[nbr]) {
        dist[nbr] = nd;
        pq.push({ d: nd, node: nbr });
      }
    }
  }
  return Infinity;
}

export function computeEfficientRoute(startingTerminal, dropOffs) {
  const routes = permutations(dropOffs).map((p) => [startingTerminal, ...p]);

  let efficientRoute = null;
  let efficientDistance = Infinity;

  for (const route of routes) {
    let distance = 0;
    for (let i = 1; i < route.length; i++) {
      distance += dijkstra(route[i - 1], route[i]);
    }
    if (distance < efficientDistance) {
      efficientDistance = distance;
      efficientRoute = route;
    }
  }

  // returning to nearest terminal (your code uses A, M, S)
  const terminals = ["A", "M", "S"];
  const last = efficientRoute[efficientRoute.length - 1];

  let nearestTerminal = terminals[0];
  let nearestDistance = dijkstra(last, terminals[0]);

  for (const t of terminals) {
    const d = dijkstra(last, t);
    if (d < nearestDistance) {
      nearestDistance = d;
      nearestTerminal = t;
    }
  }

  const totalDistance = efficientDistance + nearestDistance;
  const finalRoute = [...efficientRoute, nearestTerminal];
  const cost = totalDistance * operatingCost;

  return { finalRoute, totalDistance, cost, start: finalRoute[0], end: finalRoute[finalRoute.length - 1] };
}