import { describe, expect, it, vi } from 'vitest';
import {
  Measurement,
  ConsoleSink,
  Ga4Sink,
  NULL_MEASUREMENT,
} from '@adored/portfolio-revenue';

describe('portfolio-revenue measurement core (domain-neutral)', () => {
  it('ConsoleSink writes one parseable [pre] JSON line carrying event + dims', () => {
    const lines: string[] = [];
    const m = new Measurement([new ConsoleSink((l) => lines.push(l))]);
    m.emit('handoff_started', { brand: 'gotript', provider: 'expedia', clickId: 'abc' }, 1234);
    expect(lines).toHaveLength(1);
    expect(lines[0].startsWith('[pre] ')).toBe(true);
    const parsed = JSON.parse(lines[0].slice('[pre] '.length));
    expect(parsed).toMatchObject({
      e: 'handoff_started',
      at: 1234,
      brand: 'gotript',
      provider: 'expedia',
      clickId: 'abc',
    });
  });

  it('Ga4Sink forwards the event name + non-undefined dims to the sender', () => {
    const send = vi.fn();
    const m = new Measurement([new Ga4Sink(send)]);
    m.emit('cta_clicked', { brand: 'stayviaowner', provider: 'vrbo', subject: undefined });
    expect(send).toHaveBeenCalledTimes(1);
    const [name, params] = send.mock.calls[0]!;
    expect(name).toBe('cta_clicked');
    expect(params).toEqual({ brand: 'stayviaowner', provider: 'vrbo' }); // undefined dropped
  });

  it('fans out to every sink and isolates a throwing one', () => {
    const send = vi.fn();
    const lines: string[] = [];
    const boom = { name: 'boom', emit: () => { throw new Error('boom'); } };
    const m = new Measurement([boom, new ConsoleSink((l) => lines.push(l)), new Ga4Sink(send)]);
    expect(() => m.emit('page_view', { brand: 'gobookt' })).not.toThrow();
    expect(lines).toHaveLength(1); // console sink still ran despite the throwing sink first
    expect(send).toHaveBeenCalledTimes(1); // ga4 sink still ran
  });

  it('NULL_MEASUREMENT is a safe no-op with no sinks', () => {
    expect(() => NULL_MEASUREMENT.emit('page_view', { brand: 'x' })).not.toThrow();
    expect(NULL_MEASUREMENT.sinkNames).toEqual([]);
  });
});
