import { useState } from 'react'
import { Search, Filter, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const traces = [
  {
    id: '1',
    traceId: 'tr-123456789',
    service: 'api-gateway',
    operation: 'GET /api/users',
    duration: 124,
    timestamp: '2024-01-15 10:23:45',
    status: 'success',
    spans: 5,
  },
  {
    id: '2',
    traceId: 'tr-987654321',
    service: 'user-service',
    operation: 'POST /api/users',
    duration: 256,
    timestamp: '2024-01-15 10:22:30',
    status: 'success',
    spans: 8,
  },
  {
    id: '3',
    traceId: 'tr-456789123',
    service: 'order-service',
    operation: 'GET /api/orders/123',
    duration: 892,
    timestamp: '2024-01-15 10:21:15',
    status: 'error',
    spans: 12,
  },
  {
    id: '4',
    traceId: 'tr-789123456',
    service: 'payment-service',
    operation: 'POST /api/payments',
    duration: 345,
    timestamp: '2024-01-15 10:20:00',
    status: 'success',
    spans: 6,
  },
]

export default function Traces() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTrace, setSelectedTrace] = useState<string | null>(null)

  const filteredTraces = traces.filter(trace =>
    trace.operation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trace.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trace.traceId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Distributed Traces</h2>
        <p className="text-muted-foreground mt-2">Analyze request flow across your services</p>
      </div>

      <div className="bg-card rounded-lg border border-border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search traces..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Trace ID</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Service</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Operation</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Duration</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Spans</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredTraces.map((trace) => (
                <tr
                  key={trace.id}
                  className={cn(
                    "border-b border-border hover:bg-accent/50 cursor-pointer transition-colors",
                    selectedTrace === trace.id && "bg-accent"
                  )}
                  onClick={() => setSelectedTrace(trace.id)}
                >
                  <td className="p-4">
                    {trace.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                  </td>
                  <td className="p-4 font-mono text-sm">{trace.traceId}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                      {trace.service}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-sm">{trace.operation}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className={cn(
                        "text-sm",
                        trace.duration > 500 ? "text-red-600" : trace.duration > 200 ? "text-yellow-600" : "text-green-600"
                      )}>
                        {trace.duration}ms
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm">{trace.spans}</td>
                  <td className="p-4 text-sm text-muted-foreground">{trace.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTrace && (
        <div className="mt-6 bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Trace Details</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Trace ID</p>
                <p className="font-mono">{traces.find(t => t.id === selectedTrace)?.traceId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Duration</p>
                <p className="font-mono">{traces.find(t => t.id === selectedTrace)?.duration}ms</p>
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium mb-2">Span Timeline</p>
              <div className="space-y-2">
                {[
                  { name: 'API Gateway', duration: 10, offset: 0 },
                  { name: 'Auth Service', duration: 25, offset: 10 },
                  { name: 'User Service', duration: 45, offset: 35 },
                  { name: 'Database Query', duration: 30, offset: 80 },
                  { name: 'Response', duration: 14, offset: 110 },
                ].map((span, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-sm w-32">{span.name}</span>
                    <div className="flex-1 bg-muted rounded-full h-6 relative">
                      <div
                        className="absolute top-0 h-full bg-primary rounded-full flex items-center justify-end pr-2"
                        style={{
                          left: `${(span.offset / 124) * 100}%`,
                          width: `${(span.duration / 124) * 100}%`,
                        }}
                      >
                        <span className="text-xs text-primary-foreground font-medium">{span.duration}ms</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}