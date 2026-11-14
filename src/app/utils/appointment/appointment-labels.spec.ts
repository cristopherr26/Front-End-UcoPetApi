import { dateLabel, statusIcon, statusLabel, statusTone, timeLabel } from './appointment-labels';

describe('appointment labels', () => {
  it('names each status in Spanish with its own tone and icon', () => {
    expect(statusLabel('PENDING')).toBe('Pendiente');
    expect(statusLabel('CONFIRMED')).toBe('Confirmada');
    expect(statusLabel('COMPLETED')).toBe('Completada');
    expect(statusLabel('CANCELLED')).toBe('Cancelada');
    expect(statusTone('CANCELLED')).toBe('is-danger');
    expect(statusTone('CONFIRMED')).toBe('is-info');
    expect(statusIcon('COMPLETED')).toBe('bi-check2-all');
  });

  it('shows the time as HH:mm, whether the API sends seconds or not', () => {
    expect(timeLabel('10:30:00')).toBe('10:30');
    expect(timeLabel('08:05')).toBe('08:05');
    expect(timeLabel(null)).toBe('—');
  });

  it('formats a date without shifting the day because of the time zone', () => {
    const label = dateLabel('2026-11-07');
    expect(label).toContain('7');
    expect(label).toContain('2026');
    expect(dateLabel(null)).toBe('—');
  });
});
