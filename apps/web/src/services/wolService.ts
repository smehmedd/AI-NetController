import { HostDevice, Weekday, WolPacketPayload, WolSchedule } from '../types';

export const STORAGE_KEY_WOL_SCHEDULES = 'cst_wol_schedules_config_v1';

export const DEFAULT_WOL_SCHEDULES: WolSchedule[] = [
  {
    id: 'sched-lab-morning-01',
    name: 'Wake Lab PCs (Morning Schedule)',
    targetType: 'all_lab',
    targetName: 'All Lab PCs (Tag: Lab)',
    time: '08:00',
    days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    enabled: true,
    broadcastIp: '192.168.1.255',
    port: 9,
    notes: 'Automated recurring wake-up for University CST Lab workstations prior to morning 08:30 practical sessions',
    createdTimestamp: 1726140000000
  },
  {
    id: 'sched-home-sync-02',
    name: 'Home Workstation Daily Warm-Up',
    targetType: 'specific_device',
    targetDeviceId: 'HOME-WORKSTATION',
    targetName: 'HOME-WORKSTATION (Laptop)',
    targetMac: '00:2B:67:89:AB:CD',
    time: '07:30',
    days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    enabled: false,
    broadcastIp: '192.168.1.255',
    port: 9,
    notes: 'Wake host for remote backup sync, agent daemon heartbeats, and Git sync',
    createdTimestamp: 1726141000000
  },
  {
    id: 'sched-fleet-night-03',
    name: 'Weekend Fleet Security Audit Wake',
    targetType: 'all_offline',
    targetName: 'All Sleeping / Offline PCs',
    time: '23:00',
    days: ['sun'],
    enabled: false,
    broadcastIp: '255.255.255.255',
    port: 9,
    notes: 'Wakes all sleeping nodes for weekly unattended security patches and Ollama model sync',
    createdTimestamp: 1726142000000
  }
];

export const WEEKDAYS_MAP: { id: Weekday; label: string; short: string; dayIndex: number }[] = [
  { id: 'mon', label: 'Понеделник', short: 'Mon', dayIndex: 1 },
  { id: 'tue', label: 'Вторник', short: 'Tue', dayIndex: 2 },
  { id: 'wed', label: 'Сряда', short: 'Wed', dayIndex: 3 },
  { id: 'thu', label: 'Четвъртък', short: 'Thu', dayIndex: 4 },
  { id: 'fri', label: 'Петък', short: 'Fri', dayIndex: 5 },
  { id: 'sat', label: 'Събота', short: 'Sat', dayIndex: 6 },
  { id: 'sun', label: 'Неделя', short: 'Sun', dayIndex: 0 }
];

/**
 * Loads recurring WoL schedules from persistent localStorage.
 * Automatically seeds defaults if no configuration exists.
 */
export function loadWolSchedules(): WolSchedule[] {
  if (typeof window === 'undefined') return DEFAULT_WOL_SCHEDULES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WOL_SCHEDULES);
    if (!raw) {
      saveWolSchedules(DEFAULT_WOL_SCHEDULES);
      return DEFAULT_WOL_SCHEDULES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_WOL_SCHEDULES;
  } catch (e) {
    console.error('Failed to parse persistent WoL schedules from localStorage:', e);
    return DEFAULT_WOL_SCHEDULES;
  }
}

/**
 * Persists recurring WoL schedules to localStorage.
 */
export function saveWolSchedules(schedules: WolSchedule[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_WOL_SCHEDULES, JSON.stringify(schedules));
  } catch (e) {
    console.error('Failed to persist WoL schedules to localStorage:', e);
  }
}

/**
 * Resolves target devices matching a schedule's targeting policy.
 */
export function resolveScheduleTargets(
  schedule: WolSchedule,
  hosts: HostDevice[] = []
): { id: string; name: string; mac: string; ip: string }[] {
  const safeHosts = Array.isArray(hosts) ? hosts : [];

  switch (schedule.targetType) {
    case 'all_lab': {
      const labHosts = safeHosts.filter(
        h =>
          h.tags?.some(t => t?.toLowerCase() === 'lab') ||
          h.name?.toLowerCase().includes('lab') ||
          h.id?.toLowerCase().includes('lab')
      );
      if (labHosts.length > 0) {
        return labHosts.map(h => ({ id: h.id, name: h.name, mac: h.mac, ip: h.ip }));
      }
      // Fallback: If no host has lab tag, return first host or empty array
      return safeHosts.slice(0, 1).map(h => ({ id: h.id, name: h.name, mac: h.mac, ip: h.ip }));
    }

    case 'all_offline': {
      const offline = safeHosts.filter(h => !h.isOnline);
      return offline.map(h => ({ id: h.id, name: h.name, mac: h.mac, ip: h.ip }));
    }

    case 'all_hosts': {
      return safeHosts.map(h => ({ id: h.id, name: h.name, mac: h.mac, ip: h.ip }));
    }

    case 'specific_device': {
      const target = safeHosts.find(
        h => h.id === schedule.targetDeviceId || (schedule.targetMac && h.mac === schedule.targetMac)
      );
      if (target) {
        return [{ id: target.id, name: target.name, mac: target.mac, ip: target.ip }];
      }
      if (schedule.targetMac) {
        return [{
          id: schedule.targetDeviceId || 'CUSTOM-TARGET',
          name: schedule.targetName || 'Specific Target Host',
          mac: schedule.targetMac,
          ip: schedule.broadcastIp || '255.255.255.255'
        }];
      }
      return [];
    }

    case 'custom_mac': {
      return [{
        id: 'CUSTOM-MAC',
        name: schedule.targetName || 'Custom NIC Target',
        mac: schedule.targetMac || '00:1A:2B:3C:4D:5E',
        ip: schedule.broadcastIp || '255.255.255.255'
      }];
    }

    default:
      return [];
  }
}

/**
 * Calculates human-readable summary of recurring days.
 */
export function formatDaysSummary(days: Weekday[]): string {
  if (!days || days.length === 0) return 'No days selected';
  if (days.length === 7) return 'Daily (Mon - Sun)';
  const weekdays: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri'];
  const weekends: Weekday[] = ['sat', 'sun'];

  const isWeekdays = weekdays.every(d => days.includes(d)) && days.length === 5;
  if (isWeekdays) return 'Weekdays (Mon - Fri)';

  const isWeekends = weekends.every(d => days.includes(d)) && days.length === 2;
  if (isWeekends) return 'Weekends (Sat, Sun)';

  const order: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  return order
    .filter(d => days.includes(d))
    .map(d => d.toUpperCase())
    .join(', ');
}

/**
 * Formats "08:00" to "08:00 AM" or localized string.
 */
export function formatTimeDisplay(timeStr: string): string {
  if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) return timeStr || '--:--';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  if (isNaN(h) || h < 0 || h > 23) return timeStr;
  const m = (mStr || '00').padStart(2, '0').slice(0, 2);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${h.toString().padStart(2, '0')}:${m} (${displayH}:${m} ${ampm})`;
}

/**
 * Calculates next upcoming run time for a recurring schedule.
 */
export function calculateNextRun(
  schedule: WolSchedule,
  referenceDate: Date = new Date()
): { nextDate: Date; relativeText: string; timeUntilFormatted: string } | null {
  if (!schedule || !schedule.days || schedule.days.length === 0 || !schedule.time || !schedule.time.includes(':')) {
    return null;
  }

  const [targetH, targetM] = schedule.time.split(':').map(Number);
  if (isNaN(targetH) || isNaN(targetM) || targetH < 0 || targetH > 23 || targetM < 0 || targetM > 59) {
    return null;
  }

  const dayIndexMap: Record<Weekday, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6
  };

  const allowedDayIndices = new Set(schedule.days.map(d => dayIndexMap[d]));

  // Check today and the next 7 days
  for (let offset = 0; offset <= 7; offset++) {
    const candidate = new Date(referenceDate);
    candidate.setDate(referenceDate.getDate() + offset);
    candidate.setHours(targetH, targetM, 0, 0);

    const dayIndex = candidate.getDay();
    if (allowedDayIndices.has(dayIndex)) {
      if (candidate.getTime() > referenceDate.getTime()) {
        // Calculate relative difference
        const diffMs = candidate.getTime() - referenceDate.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMins / 60);
        const remMins = diffMins % 60;

        let timeUntil = '';
        if (diffHours > 0) {
          timeUntil = `${diffHours}h ${remMins}m`;
        } else {
          timeUntil = `${diffMins}m`;
        }

        let dayLabel = '';
        if (offset === 0) {
          dayLabel = 'Today';
        } else if (offset === 1) {
          dayLabel = 'Tomorrow';
        } else {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          dayLabel = `${dayNames[dayIndex]}`;
        }

        return {
          nextDate: candidate,
          relativeText: `${dayLabel} at ${schedule.time}`,
          timeUntilFormatted: timeUntil
        };
      }
    }
  }

  return null;
}

export function normalizeMac(mac: string): string | null {
  if (!mac || typeof mac !== 'string') return null;
  const clean = mac.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
  if (clean.length !== 12) return null;
  return clean.match(/.{1,2}/g)?.join(':') || null;
}

/**
 * Generates an Ethernet Magic Packet (102 bytes standard, or 108 bytes with SecureOn password):
 * - 6 bytes of 0xFF
 * - 16 repetitions of the 6-byte target MAC address
 * - Optional 6-byte SecureOn password (AMD WoL security standard)
 */
export function generateMagicPacket(
  mac: string,
  broadcastIp: string = '255.255.255.255',
  port: number = 9,
  secureOnPassword?: string
): WolPacketPayload {
  const cleanMac = (mac || '').replace(/[^a-fA-F0-9]/g, '').toUpperCase();
  if (cleanMac.length !== 12) {
    throw new Error('Invalid MAC address. Must contain exactly 12 hexadecimal characters.');
  }

  const safePort = Number.isInteger(port) && port >= 1 && port <= 65535 ? port : 9;
  const safeIp = broadcastIp && typeof broadcastIp === 'string' && broadcastIp.trim() ? broadcastIp.trim() : '255.255.255.255';

  const macBytes: number[] = [];
  for (let i = 0; i < 12; i += 2) {
    macBytes.push(parseInt(cleanMac.substring(i, i + 2), 16));
  }

  // Parse optional 6-byte SecureOn password. When supplied, it must be exactly 12 hex chars.
  const cleanPassword = (secureOnPassword || '').replace(/[^a-fA-F0-9]/g, '').toUpperCase();
  if (secureOnPassword !== undefined && secureOnPassword !== null && secureOnPassword !== '' && cleanPassword.length !== 12) {
    throw new Error('SecureOn password must contain exactly 12 hexadecimal characters.');
  }
  const hasSecureOn = cleanPassword.length === 12;
  const passwordBytes: number[] = [];
  if (hasSecureOn) {
    for (let i = 0; i < 12; i += 2) {
      passwordBytes.push(parseInt(cleanPassword.substring(i, i + 2), 16));
    }
  }

  const totalLength = hasSecureOn ? 108 : 102;
  const packet = new Uint8Array(totalLength);

  // First 6 bytes are 0xFF
  for (let i = 0; i < 6; i++) {
    packet[i] = 0xff;
  }

  // Next 16 * 6 = 96 bytes are repetitions of MAC
  let offset = 6;
  for (let rep = 0; rep < 16; rep++) {
    for (let b = 0; b < 6; b++) {
      packet[offset++] = macBytes[b];
    }
  }

  // Optional 6-byte SecureOn password appendix
  if (hasSecureOn) {
    for (let b = 0; b < 6; b++) {
      packet[offset++] = passwordBytes[b];
    }
  }

  // Format as Hex string
  const hexParts: string[] = [];
  for (let i = 0; i < packet.length; i++) {
    hexParts.push(packet[i].toString(16).padStart(2, '0').toUpperCase());
  }

  return {
    mac: macBytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(':'),
    broadcastIp: safeIp,
    port: safePort,
    rawHex: hexParts.join(' '),
    bytesCount: packet.length,
    timestamp: new Date().toLocaleTimeString('bg-BG', { hour12: false })
  };
}

export function formatHexDump(hexString: string): string[] {
  const bytes = hexString.split(' ');
  const lines: string[] = [];
  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = bytes.slice(i, i + 16);
    const offsetHex = i.toString(16).padStart(4, '0').toUpperCase();
    const hexGroup = chunk.join(' ');
    lines.push(`${offsetHex}  ${hexGroup}`);
  }
  return lines;
}
