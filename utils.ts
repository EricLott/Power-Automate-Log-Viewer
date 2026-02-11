import { LogEntry } from './types';

export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

export const parseLogFile = (content: string): LogEntry[] => {
  const lines = content.split('\n');
  const validLogs: LogEntry[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const parsed = JSON.parse(trimmed);
      // Validate against the specific schema requirements
      // Ensure essential fields exist: eventTimestamp, component, traceLevel
      if (
        parsed.eventTimestamp && 
        parsed.component && 
        parsed.traceLevel
      ) {
        validLogs.push(parsed);
      }
    } catch (error) {
      // Silently fail for malformed lines (like cut-off JSON)
      // In a production app, we might want to collect these errors
    }
  }

  // Sort by timestamp default
  return validLogs.sort((a, b) => 
    new Date(a.eventTimestamp).getTime() - new Date(b.eventTimestamp).getTime()
  );
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3 
  } as any);
};

export const getTraceLevelColor = (level: string) => {
  const l = level.toLowerCase();
  if (l === 'error' || l === 'critical') return 'text-red-600 bg-red-50 border-red-200';
  if (l === 'warning' || l === 'warn') return 'text-amber-600 bg-amber-50 border-amber-200';
  if (l === 'verbose' || l === 'debug') return 'text-slate-500 bg-slate-50 border-slate-200';
  return 'text-blue-600 bg-blue-50 border-blue-200'; // Info and others
};