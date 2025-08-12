import { useState } from 'react'
import { Save, RefreshCw, AlertTriangle, Bell, Shield, Database } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Settings() {
  const [settings, setSettings] = useState({
    samplingRate: 10,
    retentionDays: 30,
    alertThreshold: 500,
    enableNotifications: true,
    enableAutoSampling: true,
    enableDebugMode: false,
    apiKey: 'sk-1234567890abcdef',
    webhookUrl: 'https://example.com/webhook',
  })

  const handleSave = () => {
    // Save settings logic
    console.log('Saving settings:', settings)
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-2">Configure StackSleuth monitoring parameters</p>
      </div>

      <div className="space-y-6">
        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Data Collection</h3>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">
                Sampling Rate (%)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.samplingRate}
                onChange={(e) => setSettings({ ...settings, samplingRate: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Percentage of requests to sample
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Data Retention (days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={settings.retentionDays}
                onChange={(e) => setSettings({ ...settings, retentionDays: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground mt-1">
                How long to keep performance data
              </p>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoSampling"
                  checked={settings.enableAutoSampling}
                  onChange={(e) => setSettings({ ...settings, enableAutoSampling: e.target.checked })}
                  className="rounded border-border"
                />
                <label htmlFor="autoSampling" className="text-sm font-medium">
                  Enable Adaptive Sampling
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-6">
                Automatically adjust sampling rate based on traffic volume
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Alerts & Notifications</h3>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">
                Response Time Alert Threshold (ms)
              </label>
              <input
                type="number"
                min="10"
                max="10000"
                value={settings.alertThreshold}
                onChange={(e) => setSettings({ ...settings, alertThreshold: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Alert when response time exceeds this value
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Webhook URL
              </label>
              <input
                type="url"
                value={settings.webhookUrl}
                onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                placeholder="https://example.com/webhook"
                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Endpoint to receive alert notifications
              </p>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notifications"
                  checked={settings.enableNotifications}
                  onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
                  className="rounded border-border"
                />
                <label htmlFor="notifications" className="text-sm font-medium">
                  Enable Push Notifications
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-6">
                Receive real-time alerts for performance issues
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Security & API</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                API Key
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={settings.apiKey}
                  onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                  className="flex-1 px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Used to authenticate API requests
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="debugMode"
                checked={settings.enableDebugMode}
                onChange={(e) => setSettings({ ...settings, enableDebugMode: e.target.checked })}
                className="rounded border-border"
              />
              <label htmlFor="debugMode" className="text-sm font-medium">
                Enable Debug Mode
              </label>
            </div>
            {settings.enableDebugMode && (
              <div className="ml-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Debug Mode Enabled</span>
                </div>
                <p className="text-xs text-yellow-600 mt-1">
                  This will collect additional debugging information and may impact performance.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Save className="h-4 w-4" />
            Save Settings
          </button>
          <button className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  )
}