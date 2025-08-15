import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionReplayAgent } from '../index';

// Mock DOM elements for testing
Object.defineProperty(global, 'document', {
  value: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    body: { appendChild: vi.fn() },
    referrer: 'http://localhost:3000/'
  }
});

Object.defineProperty(global, 'window', {
  value: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    performance: {
      now: vi.fn(() => Date.now()),
      getEntriesByType: vi.fn(() => [])
    },
    location: {
      href: 'http://localhost:3000/test'
    }
  }
});

describe('SessionReplayAgent', () => {
  let agent: SessionReplayAgent;

  beforeEach(() => {
    agent = new SessionReplayAgent({
      bufferSize: 100,
      flushInterval: 1000,
      enablePrivacyMode: true
    });
  });

  it('should initialize correctly', () => {
    expect(agent).toBeDefined();
  });

  it('should start recording', () => {
    expect(() => agent.startRecording()).not.toThrow();
  });

  it('should stop recording', () => {
    agent.startRecording();
    expect(() => agent.stopRecording()).not.toThrow();
  });

  it('should export session data', () => {
    agent.startRecording();
    const sessionDataJson = agent.exportSession();
    expect(sessionDataJson).toBeDefined();
    const sessionData = JSON.parse(sessionDataJson);
    expect(sessionData.metadata.sessionId).toBeDefined();
    expect(Array.isArray(sessionData.events)).toBe(true);
  });

  it('should clear session data', () => {
    agent.startRecording();
    agent.clearSession();
    const sessionDataJson = agent.exportSession();
    const sessionData = JSON.parse(sessionDataJson);
    expect(sessionData.events).toHaveLength(0);
  });

  it('should record custom events', () => {
    agent.startRecording();
    agent.recordCustomEvent('test-event', { data: 'test' });
    const sessionDataJson = agent.exportSession();
    const sessionData = JSON.parse(sessionDataJson);
    const customEvents = sessionData.events.filter((e: any) => e.type === 'custom');
    expect(customEvents.length).toBeGreaterThan(0);
  });
}); 