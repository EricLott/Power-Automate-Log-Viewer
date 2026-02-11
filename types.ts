export interface PerfCounters {
  totalCpuUsagePercent?: number;
  processCpuUsagePercent?: number;
  processUserTimePercent?: number;
  availableMemoryMB?: number;
  percentTimeInGC?: number;
  tsActiveSessions?: number;
  tsInactiveSessions?: number;
  processorQueueLength?: number;
  systemUptimeSeconds?: number;
}

export interface MachineInfo {
  screenResolution?: string;
  processorCount?: string | number;
  netVersion?: string;
  windowsProductName?: string;
  physicalMemoryMB?: number;
  isAADJoined?: boolean;
  isDomainJoined?: boolean;
  isMachineTest?: boolean;
  // New fields for RpaAgent logs
  physicalFreeMemoryMB?: number;
  cpuLoad?: number;
  memoryLoad?: number;
  screenInfo?: Array<{
    dpi: number;
    height: number;
    isPrimary: boolean;
    width: number;
  }>;
}

export interface EventData {
  agentVersion?: string;
  rdClientLib?: string;
  executionInfo?: {
    sessionId?: number;
    processName?: string;
    threadId?: number;
    contextId?: number;
    is64BitProcess?: boolean;
    processUniqueId?: string;
  };
  httpStatusCode?: number;
  machineInfo?: MachineInfo;
  perfCounters?: PerfCounters;
  processInfo?: {
    handleCount?: number;
    startTime?: string;
    memoryWorkingSetMB?: number;
    // New fields for RpaAgent logs
    peakMemoryWorkingSetMB?: number;
    cpuLoad?: number;
  };
  uiFlowServiceProcessingInfo?: {
    isFromGateway?: boolean;
    callerType?: string;
    rpaAction?: string;
    path?: string;
  };
}

export interface LogEntry {
  // Required fields based on sample
  eventDataSchemaVersion?: string;
  schemaVersion?: string;
  agentClientId?: string;
  correlationId?: string;
  tenantId?: string;
  component: string;
  eventType?: string;
  traceLevel: "Info" | "Error" | "Warning" | "Verbose" | string;
  operationName?: string;
  eventTimestamp: string;
  durationInMilliseconds?: string | number;
  message: string;
  eventData?: EventData;
  roleInfo?: {
    geo?: string;
    region?: string;
    environment?: string;
  };
  activityId?: string;
  // Index signature for flexibility with unknown fields
  [key: string]: any;
}

export type SortDirection = 'asc' | 'desc';

export interface LogFilter {
  search: string;
  level: string;
  component: string;
}