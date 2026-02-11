import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, BarChart, Bar, Legend, Brush 
} from 'recharts';
import { LogEntry, LogFilter } from '../types';

interface LogChartsProps {
  logs: LogEntry[];
  filteredLogs?: LogEntry[];
  timeRange?: { start: number; end: number } | null;
  onTimeRangeChange?: (range: { start: number; end: number } | null) => void;
  onFilterChange?: (filters: LogFilter) => void;
  onLogSelect?: (log: LogEntry) => void;
}

const LogCharts: React.FC<LogChartsProps> = ({ logs, filteredLogs, timeRange, onTimeRangeChange, onFilterChange, onLogSelect }) => {
  const effectiveLogs = filteredLogs || logs;

  // 1. Prepare Log Volume Data (Timeline) - Always uses full dataset for context
  const volumeData = useMemo(() => {
    if (logs.length === 0) return [];

    // Determine granularity based on total duration
    const startTime = new Date(logs[0].eventTimestamp).getTime();
    const endTime = new Date(logs[logs.length - 1].eventTimestamp).getTime();
    const durationMs = endTime - startTime;
    
    // Default to 1-minute buckets, but if short duration use 10s or 1s
    let bucketSizeMs = 60000; 
    if (durationMs < 300000) bucketSizeMs = 1000; // less than 5 mins -> 1s buckets
    else if (durationMs < 3600000) bucketSizeMs = 10000; // less than 1 hour -> 10s buckets
    
    const buckets: Record<string, { time: string; timestamp: number; endTime: number; count: number; errors: number }> = {};

    logs.forEach(log => {
      const ts = new Date(log.eventTimestamp).getTime();
      const bucketKey = Math.floor(ts / bucketSizeMs) * bucketSizeMs;
      
      if (!buckets[bucketKey]) {
        // Format to Local Time with Date
        const date = new Date(bucketKey);
        buckets[bucketKey] = {
          time: date.toLocaleString(undefined, { 
            month: 'numeric', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit'
          }),
          timestamp: bucketKey,
          endTime: bucketKey + bucketSizeMs,
          count: 0,
          errors: 0
        };
      }
      
      buckets[bucketKey].count++;
      if (log.traceLevel === 'Error' || log.traceLevel === 'Critical') {
        buckets[bucketKey].errors++;
      }
    });

    return Object.values(buckets).sort((a, b) => a.timestamp - b.timestamp);
  }, [logs]);

  // Calculate brush indices based on timeRange (Controlled Brush)
  const { startIndex, endIndex } = useMemo(() => {
    if (!timeRange || volumeData.length === 0) return { startIndex: undefined, endIndex: undefined };

    let start = volumeData.findIndex(d => d.timestamp >= timeRange.start);
    if (start === -1) start = 0;

    // Find the last bucket that falls within the range
    // Since timeRange.end might match the endTime of a bucket, we look for timestamp < timeRange.end
    let end = volumeData.length - 1;
    for (let i = volumeData.length - 1; i >= 0; i--) {
      // If bucket starts before the end time, it's inside or partially inside
      if (volumeData[i].timestamp < timeRange.end) {
        end = i;
        break;
      }
    }
    
    if (end < start) end = start;

    return { startIndex: start, endIndex: end };
  }, [volumeData, timeRange]);

  // 2. Prepare Performance Data - Uses effective (filtered) logs
  const perfData = useMemo(() => {
    // Filter logs that have perfCounters OR relevant machineInfo/processInfo
    const perfLogs = effectiveLogs.filter(l => 
      l.eventData?.perfCounters || 
      (l.eventData?.machineInfo?.physicalFreeMemoryMB !== undefined) ||
      (l.eventData?.machineInfo?.cpuLoad !== undefined)
    );
    
    if (perfLogs.length === 0) return [];

    // Downsample for rendering performance if needed (max 500 points)
    const step = Math.ceil(perfLogs.length / 500);
    return perfLogs
      .filter((_, i) => i % step === 0)
      .map(log => {
        const date = new Date(log.eventTimestamp);
        const ed = log.eventData;
        const pc = ed?.perfCounters;
        const mi = ed?.machineInfo;
        const pi = ed?.processInfo;

        let cpu = 0;
        let memory = 0;
        let processCpu = 0;
        let queueLength = 0;

        if (pc) {
           cpu = pc.totalCpuUsagePercent || 0;
           memory = pc.availableMemoryMB || 0;
           processCpu = pc.processCpuUsagePercent || 0;
           queueLength = pc.processorQueueLength || 0;
        } else {
           // Fallback to new format (RpaAgent)
           cpu = mi?.cpuLoad || 0; 
           memory = mi?.physicalFreeMemoryMB || 0;
           processCpu = pi?.cpuLoad || 0;
           // queueLength not present in new format
        }

        return {
          time: date.toLocaleString(undefined, { 
            month: 'numeric', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit'
          }),
          timestamp: date.getTime(),
          cpu,
          memory,
          processCpu,
          queueLength
        };
      });
  }, [effectiveLogs]);

  // 3. Component Distribution - Uses effective (filtered) logs
  const componentData = useMemo(() => {
    const counts: Record<string, number> = {};
    effectiveLogs.forEach(l => {
      counts[l.component] = (counts[l.component] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 components
  }, [effectiveLogs]);

  const handleBrushChange = (e: any) => {
    if (e.startIndex !== undefined && e.endIndex !== undefined) {
      const startItem = volumeData[e.startIndex];
      const endItem = volumeData[e.endIndex];
      if (startItem && endItem && onTimeRangeChange) {
        // Use endTime of the last selected bucket to include it fully
        const newStart = startItem.timestamp;
        const newEnd = endItem.endTime;

        // Prevent infinite loop by checking if values actually changed
        // Recharts Brush can trigger onChange even if values map to the same items or during renders
        if (timeRange && timeRange.start === newStart && timeRange.end === newEnd) {
          return;
        }

        onTimeRangeChange({ start: newStart, end: newEnd });
      }
    }
  };

  const handleChartClick = (e: any) => {
    if (e && e.activePayload && e.activePayload.length > 0) {
      const data = e.activePayload[0].payload;
      
      // 1. Zoom Time
      if (onTimeRangeChange) {
        // Check equality to prevent loop is less critical here as it's a click, but good practice
        const newStart = data.timestamp;
        const newEnd = data.endTime;
        if (!timeRange || timeRange.start !== newStart || timeRange.end !== newEnd) {
           onTimeRangeChange({ start: newStart, end: newEnd });
        }
      }

      // 2. Smart Filter / Select
      if (onFilterChange) {
        // Find logs in this bucket from the full dataset
        const bucketLogs = logs.filter(l => {
          const t = new Date(l.eventTimestamp).getTime();
          return t >= data.timestamp && t < data.endTime;
        });

        const errorLogs = bucketLogs.filter(l => l.traceLevel === 'Error' || l.traceLevel === 'Critical');

        if (errorLogs.length > 0) {
           // Apply Error Filter if errors exist in this bucket
           onFilterChange({ search: '', level: 'Error', component: '' });
           
           // If exactly one error, open it
           if (errorLogs.length === 1 && onLogSelect) {
             onLogSelect(errorLogs[0]);
           }
        } else {
           // Reset Level filter if no errors, to show the info logs
           onFilterChange({ search: '', level: '', component: '' });
        }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
      {/* Volume Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm xl:col-span-2">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Log Volume & Errors</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={volumeData}
              onClick={handleChartClick}
              style={{ cursor: 'pointer' }}
            >
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="time" 
                tick={{fontSize: 12, fill: '#64748b'}} 
                axisLine={false}
                tickLine={false}
                minTickGap={50}
              />
              <YAxis 
                tick={{fontSize: 12, fill: '#64748b'}} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorCount)" 
                name="All Logs" 
                isAnimationActive={false}
              />
              <Area 
                type="monotone" 
                dataKey="errors" 
                stroke="#ef4444" 
                fillOpacity={1} 
                fill="url(#colorError)" 
                name="Errors" 
                isAnimationActive={false}
              />
              <Brush 
                dataKey="time" 
                height={30} 
                stroke="#8884d8" 
                tickFormatter={() => ""}
                startIndex={startIndex}
                endIndex={endIndex}
                onChange={handleBrushChange}
                alwaysShowText={false}
              />
              <Legend verticalAlign="top" height={36}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Component Distribution */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Top Components</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={componentData} margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={100} 
                tick={{fontSize: 11, fill: '#64748b'}} 
                axisLine={false} 
                tickLine={false}
              />
              <Tooltip 
                 contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                 cursor={{fill: '#f8fafc'}}
              />
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} name="Event Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Charts - Only show if data exists */}
      {perfData.length > 0 ? (
        <>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm xl:col-span-2">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">System Performance</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={perfData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="time" 
                    tick={{fontSize: 12, fill: '#64748b'}} 
                    axisLine={false}
                    tickLine={false}
                    minTickGap={60}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{fontSize: 12, fill: '#64748b'}} 
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{fontSize: 12, fill: '#64748b'}} 
                    axisLine={false}
                    tickLine={false}
                    unit=" MB"
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="cpu" stroke="#10b981" dot={false} strokeWidth={2} name="Total CPU %" />
                  <Line yAxisId="left" type="monotone" dataKey="processCpu" stroke="#f59e0b" dot={false} strokeWidth={2} name="Process CPU %" />
                  <Line yAxisId="right" type="monotone" dataKey="memory" stroke="#6366f1" dot={false} strokeWidth={2} name="Available Mem (MB)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm xl:col-span-1">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Processor Queue</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={perfData}>
                  <defs>
                    <linearGradient id="colorQueue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="time" 
                    tick={{fontSize: 12, fill: '#64748b'}} 
                    axisLine={false}
                    tickLine={false}
                    minTickGap={50}
                  />
                  <YAxis 
                    tick={{fontSize: 12, fill: '#64748b'}} 
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="queueLength" stroke="#f43f5e" fillOpacity={1} fill="url(#colorQueue)" name="Queue Length" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default LogCharts;