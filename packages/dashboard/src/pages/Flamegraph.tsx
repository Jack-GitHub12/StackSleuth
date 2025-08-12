import { useState } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, Download, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const flamegraphData = {
  name: 'root',
  value: 1000,
  children: [
    {
      name: 'app.js',
      value: 600,
      children: [
        {
          name: 'handleRequest',
          value: 400,
          children: [
            { name: 'validateInput', value: 50 },
            { name: 'processData', value: 200 },
            { name: 'formatResponse', value: 150 },
          ],
        },
        {
          name: 'middleware',
          value: 200,
          children: [
            { name: 'authMiddleware', value: 80 },
            { name: 'corsMiddleware', value: 40 },
            { name: 'loggerMiddleware', value: 80 },
          ],
        },
      ],
    },
    {
      name: 'database.js',
      value: 300,
      children: [
        { name: 'query', value: 200 },
        { name: 'connect', value: 50 },
        { name: 'disconnect', value: 50 },
      ],
    },
    {
      name: 'utils.js',
      value: 100,
      children: [
        { name: 'parseJSON', value: 40 },
        { name: 'formatDate', value: 30 },
        { name: 'hashPassword', value: 30 },
      ],
    },
  ],
}

function FlamegraphNode({ node, depth = 0, totalValue, x = 0, width = 100 }: any) {
  const [isHovered, setIsHovered] = useState(false)
  const percentage = (node.value / totalValue) * 100
  const nodeWidth = (node.value / totalValue) * width

  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-cyan-500',
  ]
  const color = colors[depth % colors.length]

  return (
    <>
      <div
        className={cn(
          "absolute border border-background transition-all cursor-pointer",
          color,
          isHovered && "brightness-110 z-10"
        )}
        style={{
          left: `${x}%`,
          top: `${depth * 30}px`,
          width: `${nodeWidth}%`,
          height: '28px',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="px-1 py-1 text-xs text-white truncate">
          {node.name} ({percentage.toFixed(1)}%)
        </div>
        {isHovered && (
          <div className="absolute bottom-full left-0 mb-2 p-2 bg-popover text-popover-foreground rounded-md shadow-lg z-20 whitespace-nowrap">
            <p className="font-semibold">{node.name}</p>
            <p className="text-sm">Time: {node.value}ms</p>
            <p className="text-sm">Percentage: {percentage.toFixed(2)}%</p>
          </div>
        )}
      </div>
      {node.children && node.children.map((child: any, i: number) => {
        const childX = x + node.children.slice(0, i).reduce((acc: number, c: any) => acc + (c.value / totalValue) * width, 0)
        return (
          <FlamegraphNode
            key={i}
            node={child}
            depth={depth + 1}
            totalValue={totalValue}
            x={childX}
            width={nodeWidth}
          />
        )
      })}
    </>
  )
}

export default function Flamegraph() {
  const [zoom, setZoom] = useState(1)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">CPU Flamegraph</h2>
        <p className="text-muted-foreground mt-2">Visualize performance bottlenecks in your code</p>
      </div>

      <div className="bg-card rounded-lg border border-border">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.min(zoom + 0.1, 2))}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-border mx-2" />
            <button className="p-2 hover:bg-accent rounded-lg transition-colors">
              <Download className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            Click on a frame to zoom in
          </div>
        </div>

        <div className="p-6 overflow-x-auto">
          <div
            className="relative"
            style={{
              height: '400px',
              width: `${100 * zoom}%`,
              minWidth: '100%',
            }}
          >
            <FlamegraphNode node={flamegraphData} totalValue={flamegraphData.value} />
          </div>
        </div>

        <div className="p-4 border-t border-border">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Time</p>
              <p className="font-semibold">1,000ms</p>
            </div>
            <div>
              <p className="text-muted-foreground">Samples</p>
              <p className="font-semibold">10,234</p>
            </div>
            <div>
              <p className="text-muted-foreground">Profile Duration</p>
              <p className="font-semibold">60s</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Top Functions by Time</h3>
        <div className="space-y-3">
          {[
            { name: 'processData', time: 200, percentage: 20 },
            { name: 'query', time: 200, percentage: 20 },
            { name: 'formatResponse', time: 150, percentage: 15 },
            { name: 'authMiddleware', time: 80, percentage: 8 },
            { name: 'loggerMiddleware', time: 80, percentage: 8 },
          ].map((func, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-sm">{func.name}</span>
                  <span className="text-sm text-muted-foreground">{func.time}ms</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${func.percentage}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium w-12 text-right">{func.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}