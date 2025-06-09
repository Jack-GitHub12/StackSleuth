import { Trace, Span, SpanId } from './types';

export interface FlamegraphNode {
  id: string;
  name: string;
  value: number; // duration in milliseconds
  children: FlamegraphNode[];
  depth: number;
  start: number;
  end: number;
  percentage: number;
  color?: string;
  metadata?: Record<string, any>;
}

export interface FlamegraphData {
  root: FlamegraphNode;
  totalDuration: number;
  maxDepth: number;
  nodeCount: number;
}

/**
 * Utility class for generating flamegraph data from traces
 */
export class FlamegraphGenerator {
  /**
   * Convert a trace to flamegraph data
   */
  static generateFromTrace(trace: Trace): FlamegraphData {
    if (!trace.spans.length) {
      return {
        root: {
          id: trace.id,
          name: trace.name,
          value: trace.timing.duration || 0,
          children: [],
          depth: 0,
          start: 0,
          end: trace.timing.duration || 0,
          percentage: 100
        },
        totalDuration: trace.timing.duration || 0,
        maxDepth: 0,
        nodeCount: 1
      };
    }

    // Build span hierarchy
    const spanMap = new Map<SpanId, Span>();
    const children = new Map<SpanId, Span[]>();

    // Index all spans
    trace.spans.forEach(span => {
      spanMap.set(span.id, span);
      if (!children.has(span.parentId || trace.rootSpanId)) {
        children.set(span.parentId || trace.rootSpanId, []);
      }
      children.get(span.parentId || trace.rootSpanId)!.push(span);
    });

    // Find root span or create virtual root
    const rootSpan = trace.spans.find(s => s.id === trace.rootSpanId) || trace.spans[0];
    const totalDuration = trace.timing.duration || 0;

    // Build flamegraph tree
    const root = this.buildNode(rootSpan, children, spanMap, 0, totalDuration);
    const stats = this.calculateStats(root);

    return {
      root,
      totalDuration,
      maxDepth: stats.maxDepth,
      nodeCount: stats.nodeCount
    };
  }

  /**
   * Generate flamegraph from multiple traces for comparison
   */
  static generateComparison(traces: Trace[]): FlamegraphData[] {
    return traces.map(trace => this.generateFromTrace(trace));
  }

  /**
   * Merge multiple flamegraphs for aggregated view
   */
  static mergeFlamegrahs(flamegraphs: FlamegraphData[]): FlamegraphData {
    if (flamegraphs.length === 0) {
      throw new Error('Cannot merge empty flamegraph array');
    }

    if (flamegraphs.length === 1) {
      return flamegraphs[0];
    }

    // Create merged root node
    const totalDuration = flamegraphs.reduce((sum, fg) => sum + fg.totalDuration, 0);
    const avgDuration = totalDuration / flamegraphs.length;

    const mergedRoot: FlamegraphNode = {
      id: 'merged-root',
      name: 'Merged Traces',
      value: avgDuration,
      children: [],
      depth: 0,
      start: 0,
      end: avgDuration,
      percentage: 100,
      metadata: {
        traceCount: flamegraphs.length,
        totalDuration,
        avgDuration
      }
    };

    // Merge children by name
    const childrenMap = new Map<string, FlamegraphNode[]>();

    flamegraphs.forEach(fg => {
      fg.root.children.forEach(child => {
        if (!childrenMap.has(child.name)) {
          childrenMap.set(child.name, []);
        }
        childrenMap.get(child.name)!.push(child);
      });
    });

    // Create merged children
    mergedRoot.children = Array.from(childrenMap.entries()).map(([name, nodes]) => {
      const avgValue = nodes.reduce((sum, node) => sum + node.value, 0) / nodes.length;
      const merged: FlamegraphNode = {
        id: `merged-${name}`,
        name,
        value: avgValue,
        children: [],
        depth: 1,
        start: 0,
        end: avgValue,
        percentage: (avgValue / avgDuration) * 100,
        metadata: {
          nodeCount: nodes.length,
          minValue: Math.min(...nodes.map(n => n.value)),
          maxValue: Math.max(...nodes.map(n => n.value)),
          avgValue
        }
      };

      // Recursively merge children
      merged.children = this.mergeNodeChildren(nodes, merged.depth + 1, avgDuration);
      return merged;
    });

    const stats = this.calculateStats(mergedRoot);

    return {
      root: mergedRoot,
      totalDuration: avgDuration,
      maxDepth: stats.maxDepth,
      nodeCount: stats.nodeCount
    };
  }

  /**
   * Build flamegraph node from span
   */
  private static buildNode(
    span: Span,
    children: Map<SpanId, Span[]>,
    spanMap: Map<SpanId, Span>,
    depth: number,
    totalDuration: number
  ): FlamegraphNode {
    const duration = span.timing.duration || 0;
    const start = span.timing.start.nanos;
    const end = span.timing.end?.nanos || start;

    const node: FlamegraphNode = {
      id: span.id,
      name: span.name,
      value: duration,
      children: [],
      depth,
      start: (start - (spanMap.get(span.traceId)?.timing.start.nanos || start)) / 1000000, // Convert to ms
      end: (end - (spanMap.get(span.traceId)?.timing.start.nanos || start)) / 1000000,
      percentage: totalDuration > 0 ? (duration / totalDuration) * 100 : 0,
      color: this.getColorForSpanType(span.type),
      metadata: {
        type: span.type,
        status: span.status,
        ...span.metadata
      }
    };

    // Add children
    const spanChildren = children.get(span.id) || [];
    node.children = spanChildren
      .sort((a, b) => a.timing.start.nanos - b.timing.start.nanos)
      .map(child => this.buildNode(child, children, spanMap, depth + 1, totalDuration));

    return node;
  }

  /**
   * Merge children from multiple nodes
   */
  private static mergeNodeChildren(nodes: FlamegraphNode[], depth: number, totalDuration: number): FlamegraphNode[] {
    const childrenMap = new Map<string, FlamegraphNode[]>();

    nodes.forEach(node => {
      node.children.forEach(child => {
        if (!childrenMap.has(child.name)) {
          childrenMap.set(child.name, []);
        }
        childrenMap.get(child.name)!.push(child);
      });
    });

    return Array.from(childrenMap.entries()).map(([name, children]) => {
      const avgValue = children.reduce((sum, child) => sum + child.value, 0) / children.length;
      
      const merged: FlamegraphNode = {
        id: `merged-${depth}-${name}`,
        name,
        value: avgValue,
        children: this.mergeNodeChildren(children, depth + 1, totalDuration),
        depth,
        start: 0,
        end: avgValue,
        percentage: (avgValue / totalDuration) * 100,
        metadata: {
          nodeCount: children.length,
          minValue: Math.min(...children.map(n => n.value)),
          maxValue: Math.max(...children.map(n => n.value)),
          avgValue
        }
      };

      return merged;
    });
  }

  /**
   * Calculate statistics for a flamegraph
   */
  private static calculateStats(root: FlamegraphNode): { maxDepth: number; nodeCount: number } {
    let maxDepth = 0;
    let nodeCount = 0;

    const traverse = (node: FlamegraphNode, depth: number) => {
      maxDepth = Math.max(maxDepth, depth);
      nodeCount++;

      node.children.forEach(child => traverse(child, depth + 1));
    };

    traverse(root, 0);

    return { maxDepth, nodeCount };
  }

  /**
   * Get color for span type
   */
  private static getColorForSpanType(spanType: string): string {
    const colors: Record<string, string> = {
      'http_request': '#3B82F6',    // Blue
      'db_query': '#10B981',        // Green
      'react_render': '#F59E0B',    // Yellow
      'function_call': '#8B5CF6',   // Purple
      'custom': '#6B7280'           // Gray
    };

    return colors[spanType] || colors.custom;
  }

  /**
   * Filter flamegraph by minimum duration
   */
  static filterByDuration(flamegraph: FlamegraphData, minDuration: number): FlamegraphData {
    const filterNode = (node: FlamegraphNode): FlamegraphNode | null => {
      if (node.value < minDuration) {
        return null;
      }

      const filteredChildren = node.children
        .map(child => filterNode(child))
        .filter((child): child is FlamegraphNode => child !== null);

      return {
        ...node,
        children: filteredChildren
      };
    };

    const filteredRoot = filterNode(flamegraph.root);
    if (!filteredRoot) {
      throw new Error('All nodes filtered out');
    }

    const stats = this.calculateStats(filteredRoot);

    return {
      root: filteredRoot,
      totalDuration: flamegraph.totalDuration,
      maxDepth: stats.maxDepth,
      nodeCount: stats.nodeCount
    };
  }

  /**
   * Convert flamegraph to SVG format
   */
  static toSVG(flamegraph: FlamegraphData, width: number = 1200, height: number = 600): string {
    const { root, maxDepth } = flamegraph;
    const rowHeight = height / (maxDepth + 1);
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += '<style>.node { stroke: #fff; stroke-width: 1; } .text { font-family: Arial; font-size: 12px; fill: #fff; }</style>';

    const renderNode = (node: FlamegraphNode, x: number, width: number) => {
      const nodeWidth = (node.percentage / 100) * width;
      const y = node.depth * rowHeight;
      
      svg += `<rect class="node" x="${x}" y="${y}" width="${nodeWidth}" height="${rowHeight}" fill="${node.color || '#6B7280'}">`;
      svg += `<title>${node.name} (${node.value.toFixed(2)}ms)</title>`;
      svg += '</rect>';
      
      if (nodeWidth > 50) { // Only show text if there's enough space
        svg += `<text class="text" x="${x + 5}" y="${y + rowHeight/2 + 4}">${node.name}</text>`;
      }

      let childX = x;
      node.children.forEach(child => {
        renderNode(child, childX, nodeWidth);
        childX += (child.percentage / 100) * nodeWidth;
      });
    };

    renderNode(root, 0, width);
    svg += '</svg>';

    return svg;
  }
} 