import { ArrowUp, ArrowDown, Activity, Clock, Database, Globe } from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const performanceData = [
  { time: '00:00', cpu: 45, memory: 62, requests: 120 },
  { time: '04:00', cpu: 38, memory: 58, requests: 98 },
  { time: '08:00', cpu: 52, memory: 65, requests: 180 },
  { time: '12:00', cpu: 74, memory: 72, requests: 240 },
  { time: '16:00', cpu: 68, memory: 70, requests: 210 },
  { time: '20:00', cpu: 56, memory: 64, requests: 165 },
]

const stats = [
  { name: 'Avg Response Time', value: '124ms', change: -8.2, icon: Clock },
  { name: 'Requests/sec', value: '1,240', change: 12.5, icon: Activity },
  { name: 'DB Query Time', value: '45ms', change: -5.1, icon: Database },
  { name: 'Error Rate', value: '0.12%', change: -15.4, icon: Globe },
]

export default function Dashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Performance Dashboard</h2>
        <p className="text-muted-foreground mt-2">Real-time monitoring of your application stack</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-card p-6 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <stat.icon className="h-5 w-5 text-muted-foreground" />
              <span className={cn(
                "flex items-center text-sm font-medium",
                stat.change > 0 ? "text-green-600" : "text-red-600"
              )}>
                {stat.change > 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                {Math.abs(stat.change)}%
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.name}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold mb-4">CPU & Memory Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="time" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Line type="monotone" dataKey="cpu" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="memory" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold mb-4">Request Volume</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="time" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Area type="monotone" dataKey="requests" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border border-border">
        <h3 className="text-lg font-semibold mb-4">Recent Traces</h3>
        <div className="space-y-3">
          {[
            { endpoint: 'GET /api/users', duration: '124ms', status: 200 },
            { endpoint: 'POST /api/products', duration: '256ms', status: 201 },
            { endpoint: 'GET /api/orders/123', duration: '89ms', status: 200 },
            { endpoint: 'PUT /api/users/456', duration: '345ms', status: 500 },
            { endpoint: 'DELETE /api/cart/789', duration: '67ms', status: 204 },
          ].map((trace, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors">
              <div className="flex items-center gap-4">
                <span className={cn(
                  "text-xs font-medium px-2 py-1 rounded",
                  trace.status < 400 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                )}>
                  {trace.status}
                </span>
                <span className="font-mono text-sm">{trace.endpoint}</span>
              </div>
              <span className="text-sm text-muted-foreground">{trace.duration}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}