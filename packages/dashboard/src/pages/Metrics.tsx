import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, TrendingDown, Database, Globe, Cpu, HardDrive } from 'lucide-react'
import { cn } from '@/lib/utils'

const responseTimeData = [
  { endpoint: '/api/users', p50: 45, p95: 120, p99: 250 },
  { endpoint: '/api/products', p50: 60, p95: 150, p99: 300 },
  { endpoint: '/api/orders', p50: 80, p95: 200, p99: 450 },
  { endpoint: '/api/auth', p50: 30, p95: 85, p99: 150 },
  { endpoint: '/api/search', p50: 120, p95: 350, p99: 600 },
]

const errorRateData = [
  { time: '00:00', rate: 0.1 },
  { time: '04:00', rate: 0.08 },
  { time: '08:00', rate: 0.15 },
  { time: '12:00', rate: 0.25 },
  { time: '16:00', rate: 0.18 },
  { time: '20:00', rate: 0.12 },
]

const resourceUsageData = [
  { name: 'CPU', value: 68, color: 'hsl(var(--primary))' },
  { name: 'Memory', value: 72, color: 'hsl(var(--destructive))' },
  { name: 'Disk I/O', value: 45, color: 'hsl(var(--accent))' },
  { name: 'Network', value: 38, color: '#10b981' },
]

const dbMetrics = [
  { metric: 'Query Latency', value: '45ms', trend: -5.2, icon: Database },
  { metric: 'Connections', value: '124/150', trend: 8.1, icon: Globe },
  { metric: 'CPU Usage', value: '68%', trend: 12.5, icon: Cpu },
  { metric: 'Storage', value: '245GB', trend: 3.2, icon: HardDrive },
]

export default function Metrics() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Application Metrics</h2>
        <p className="text-muted-foreground mt-2">Monitor key performance indicators across your stack</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold mb-4">Response Time Percentiles</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="endpoint" angle={-45} textAnchor="end" height={80} className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Bar dataKey="p50" fill="hsl(var(--primary))" name="P50" />
              <Bar dataKey="p95" fill="hsl(var(--destructive))" name="P95" />
              <Bar dataKey="p99" fill="hsl(var(--accent))" name="P99" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold mb-4">Error Rate Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={errorRateData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="time" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(value) => `${value}%`} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
                formatter={(value: any) => `${value}%`}
              />
              <Line 
                type="monotone" 
                dataKey="rate" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--destructive))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold mb-4">Resource Usage</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={resourceUsageData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {resourceUsageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {resourceUsageData.map((resource) => (
              <div key={resource.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: resource.color }} />
                  <span>{resource.name}</span>
                </div>
                <span className="font-medium">{resource.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold mb-4">Database Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            {dbMetrics.map((metric) => (
              <div key={metric.metric} className="p-4 bg-background rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <metric.icon className="h-5 w-5 text-muted-foreground" />
                  <span className={cn(
                    "flex items-center text-sm font-medium",
                    metric.trend > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {metric.trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {Math.abs(metric.trend)}%
                  </span>
                </div>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-sm text-muted-foreground">{metric.metric}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border border-border">
        <h3 className="text-lg font-semibold mb-4">Service Health Status</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { service: 'API Gateway', status: 'healthy', uptime: '99.99%' },
            { service: 'User Service', status: 'healthy', uptime: '99.95%' },
            { service: 'Order Service', status: 'degraded', uptime: '98.50%' },
            { service: 'Payment Service', status: 'healthy', uptime: '99.98%' },
            { service: 'Notification Service', status: 'healthy', uptime: '99.90%' },
            { service: 'Analytics Service', status: 'down', uptime: '95.20%' },
            { service: 'Search Service', status: 'healthy', uptime: '99.85%' },
            { service: 'Cache Service', status: 'healthy', uptime: '99.99%' },
          ].map((service) => (
            <div key={service.service} className="p-4 bg-background rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  service.status === 'healthy' ? "bg-green-500" :
                  service.status === 'degraded' ? "bg-yellow-500" : "bg-red-500"
                )} />
                <span className="text-sm text-muted-foreground">{service.uptime}</span>
              </div>
              <p className="font-medium">{service.service}</p>
              <p className={cn(
                "text-sm capitalize",
                service.status === 'healthy' ? "text-green-600" :
                service.status === 'degraded' ? "text-yellow-600" : "text-red-600"
              )}>
                {service.status}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}