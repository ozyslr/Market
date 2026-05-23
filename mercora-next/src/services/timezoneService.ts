/**
 * Timezone Service (STREAM I)
 * Handles timezone detection and conversion
 */

export interface TimezoneInfo {
  name: string;
  offset: number;
  isDST: boolean;
  code: string;
  region: string;
}

class TimezoneService {
  private readonly SUPPORTED_TIMEZONES: Record<string, TimezoneInfo> = {
    // Europe
    'Europe/London': {
      name: 'Greenwich Mean Time',
      offset: 0,
      isDST: false,
      code: 'GMT',
      region: 'EU',
    },
    'Europe/Paris': {
      name: 'Central European Time',
      offset: 1,
      isDST: false,
      code: 'CET',
      region: 'EU',
    },
    'Europe/Berlin': {
      name: 'Central European Time',
      offset: 1,
      isDST: false,
      code: 'CET',
      region: 'EU',
    },
    'Europe/Istanbul': {
      name: 'Eastern European Time',
      offset: 3,
      isDST: false,
      code: 'EET',
      region: 'TR',
    },

    // Asia
    'Asia/Istanbul': {
      name: 'Turkey Standard Time',
      offset: 3,
      isDST: false,
      code: 'EET',
      region: 'TR',
    },
    'Asia/Dubai': {
      name: 'Gulf Standard Time',
      offset: 4,
      isDST: false,
      code: 'GST',
      region: 'AE',
    },
    'Asia/Shanghai': {
      name: 'China Standard Time',
      offset: 8,
      isDST: false,
      code: 'CST',
      region: 'CN',
    },

    // Americas
    'America/New_York': {
      name: 'Eastern Standard Time',
      offset: -5,
      isDST: false,
      code: 'EST',
      region: 'US',
    },
    'America/Los_Angeles': {
      name: 'Pacific Standard Time',
      offset: -8,
      isDST: false,
      code: 'PST',
      region: 'US',
    },
    'America/Mexico_City': {
      name: 'Central Standard Time',
      offset: -6,
      isDST: false,
      code: 'CST',
      region: 'MX',
    },
    'America/Sao_Paulo': {
      name: 'Brasília Time',
      offset: -3,
      isDST: false,
      code: 'BRT',
      region: 'BR',
    },
  };

  /**
   * Get browser timezone
   */
  getBrowserTimezone(): string {
    if (typeof window !== 'undefined') {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return 'UTC';
  }

  /**
   * Get timezone info
   */
  getTimezoneInfo(timezone: string): TimezoneInfo | null {
    return this.SUPPORTED_TIMEZONES[timezone] || null;
  }

  /**
   * Convert time between timezones
   */
  convertTime(
    date: Date,
    fromTimezone: string,
    toTimezone: string
  ): Date {
    try {
      // Get the date in the target timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: toTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const parts = formatter.formatToParts(date);
      const converted = new Date(
        parseInt(parts.find((p) => p.type === 'year')?.value || '2000'),
        parseInt(parts.find((p) => p.type === 'month')?.value || '1') - 1,
        parseInt(parts.find((p) => p.type === 'day')?.value || '1'),
        parseInt(parts.find((p) => p.type === 'hour')?.value || '0'),
        parseInt(parts.find((p) => p.type === 'minute')?.value || '0'),
        parseInt(parts.find((p) => p.type === 'second')?.value || '0')
      );

      return converted;
    } catch (error) {
      console.error('Timezone conversion error:', error);
      return date;
    }
  }

  /**
   * Format date/time in specific timezone
   */
  formatInTimezone(
    date: Date,
    timezone: string,
    format: 'short' | 'long' | 'full' = 'short'
  ): string {
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
      };

      if (format === 'short') {
        options.year = 'numeric';
        options.month = '2-digit';
        options.day = '2-digit';
      } else if (format === 'long') {
        options.year = 'numeric';
        options.month = 'long';
        options.day = 'numeric';
        options.hour = '2-digit';
        options.minute = '2-digit';
      } else {
        options.weekday = 'long';
        options.year = 'numeric';
        options.month = 'long';
        options.day = 'numeric';
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.second = '2-digit';
      }

      return new Intl.DateTimeFormat('en-US', options).format(date);
    } catch (error) {
      console.error('Format error:', error);
      return date.toISOString();
    }
  }

  /**
   * Get offset difference between timezones in minutes
   */
  getOffsetDifference(tz1: string, tz2: string): number {
    const info1 = this.getTimezoneInfo(tz1);
    const info2 = this.getTimezoneInfo(tz2);

    if (!info1 || !info2) return 0;

    return (info2.offset - info1.offset) * 60;
  }

  /**
   * List all supported timezones
   */
  listSupportedTimezones(): Array<{
    name: string;
    code: string;
    offset: number;
    region: string;
  }> {
    return Object.entries(this.SUPPORTED_TIMEZONES).map(([_, info]) => ({
      name: info.name,
      code: info.code,
      offset: info.offset,
      region: info.region,
    }));
  }
}

export const timezoneService = new TimezoneService();
