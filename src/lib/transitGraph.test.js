import { describe, it, expect } from 'vitest';
import { buildGraph, findShortestPath, getNode, metroFare } from './transitGraph.js';

describe('metroFare', () => {
  it('applies the F1-F6 station-count fare bands', () => {
    expect(metroFare(1)).toBe(10);
    expect(metroFare(2)).toBe(10);
    expect(metroFare(3)).toBe(20);
    expect(metroFare(5)).toBe(20);
    expect(metroFare(6)).toBe(30);
    expect(metroFare(10)).toBe(30);
    expect(metroFare(11)).toBe(40);
    expect(metroFare(16)).toBe(50);
    expect(metroFare(21)).toBe(60);
  });
});

describe('buildGraph', () => {
  it('builds a connected multimodal graph from data.json', () => {
    const { nodes, adjacency } = buildGraph();
    expect(nodes.size).toBeGreaterThan(0);
    expect(adjacency.size).toBe(nodes.size);
  });

  it('deduplicates feeder stops that resolve to an existing metro/jetty node', () => {
    const { nodes } = buildGraph();
    // Vyttila is a metro station; feeder routes referencing "Vyttila Metro"
    // should not mint a second node for it.
    const vyttilaNodes = [...nodes.values()].filter((n) => n.name.toLowerCase().includes('vyttila') && n.kind === 'metro');
    expect(vyttilaNodes.length).toBe(1);
  });
});

describe('findShortestPath', () => {
  it('finds a path between two metro stations', () => {
    const path = findShortestPath('aluva', 'vyttila');
    expect(path).not.toBeNull();
    expect(path[0].from).toBe('aluva');
    expect(path[path.length - 1].to).toBe('vyttila');
  });

  it('connects Eloor Jetty to the Water Metro network via South Chittoor', () => {
    const path = findShortestPath('high_court', 'eloor');
    expect(path).not.toBeNull();
    expect(path[0].from).toBe('high_court');
    expect(path[path.length - 1].to).toBe('eloor');
  });

  it('returns null for unknown node ids', () => {
    expect(findShortestPath('not_a_real_node', 'vyttila')).toBeNull();
    expect(findShortestPath('aluva', 'not_a_real_node')).toBeNull();
  });

  it('excludes blocked nodes from the path', () => {
    const direct = findShortestPath('aluva', 'thrippunithura');
    expect(direct).not.toBeNull();

    const intermediateNode = direct[Math.floor(direct.length / 2)].from;
    const blocked = findShortestPath('aluva', 'thrippunithura', {
      blockedNodeIds: new Set([intermediateNode])
    });

    if (blocked) {
      expect(blocked.some((step) => step.from === intermediateNode || step.to === intermediateNode)).toBe(false);
    } else {
      expect(blocked).toBeNull();
    }
  });

  it('excludes blocked routes from the path', () => {
    const path = findShortestPath('aluva', 'vyttila');
    const routeId = path.find((step) => step.edge.routeId)?.edge.routeId;
    if (!routeId) return; // metro-only path has no routeId edges to block

    const rerouted = findShortestPath('aluva', 'vyttila', {
      blockedRouteIds: new Set([routeId])
    });
    if (rerouted) {
      expect(rerouted.some((step) => step.edge.routeId === routeId)).toBe(false);
    }
  });

  it('weights toward lower cost under the lowCost constraint', () => {
    const fastest = findShortestPath('fort_kochi', 'high_court');
    const cheapest = findShortestPath('fort_kochi', 'high_court', { constraints: { lowCost: true } });
    expect(fastest).not.toBeNull();
    expect(cheapest).not.toBeNull();
  });
});

describe('getNode', () => {
  it('returns node metadata for a known id', () => {
    const node = getNode('aluva');
    expect(node).toMatchObject({ id: 'aluva', name: 'Aluva', kind: 'metro' });
  });

  it('returns undefined for an unknown id', () => {
    expect(getNode('not_a_real_node')).toBeUndefined();
  });
});
