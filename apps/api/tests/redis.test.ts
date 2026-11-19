
import { beforeEach, describe, expect, it, vi } from 'vitest';

const redisMock = vi.hoisted(() => {
  const state = {
    isOpen: false,
    isReady: false,
  };

  const connect = vi.fn<() => Promise<void>>();
  const close = vi.fn<() => Promise<void>>();
  const destroy = vi.fn<() => void>();
  const on = vi.fn();
  const ping = vi.fn<() => Promise<string>>();

  const client = {
    get isOpen() {
      return state.isOpen;
    },
    get isReady() {
      return state.isReady;
    },
    connect,
    close,
    destroy,
    on,
    ping,
    withCommandOptions: vi.fn(() => ({ ping })),
  };

  return {
    state,
    connect,
    close,
    destroy,
    on,
    ping,
    client,
  };
});

vi.mock('redis', () => ({
  createClient: () => redisMock.client,
}));

import {
  checkRedisConnection,
  closeRedisConnection,
  startRedisConnection,
} from '../src/config/redis.js';

describe('Redis connection lifecycle', () => {
  beforeEach(() => {
    redisMock.state.isOpen = false;
    redisMock.state.isReady = false;

    vi.clearAllMocks();

    redisMock.connect.mockImplementation(async () => {
      redisMock.state.isOpen = true;
      redisMock.state.isReady = true;
    });

    redisMock.close.mockImplementation(async () => {
      redisMock.state.isOpen = false;
      redisMock.state.isReady = false;
    });

    redisMock.destroy.mockImplementation(() => {
      redisMock.state.isOpen = false;
      redisMock.state.isReady = false;
    });

    redisMock.ping.mockResolvedValue('PONG');
  });

  it('connects when the client is closed', async () => {
    await startRedisConnection();

    expect(redisMock.connect).toHaveBeenCalledTimes(1);
    expect(redisMock.state.isReady).toBe(true);
  });

  it('shares the same promise for concurrent connection requests', async () => {
    let resolveConnection!: () => void;

    redisMock.connect.mockImplementation(() => {
      redisMock.state.isOpen = true;

      return new Promise<void>((resolve) => {
        resolveConnection = () => {
          redisMock.state.isReady = true;
          resolve();
        };
      });
    });

    const firstConnection = startRedisConnection();
    const secondConnection = startRedisConnection();

    expect(firstConnection).toBe(secondConnection);
    expect(redisMock.connect).toHaveBeenCalledTimes(1);

    resolveConnection();

    await Promise.all([firstConnection, secondConnection]);
  });

  it('does not reconnect when the client is already ready', async () => {
    redisMock.state.isOpen = true;
    redisMock.state.isReady = true;

    await startRedisConnection();

    expect(redisMock.connect).not.toHaveBeenCalled();
  });

  it('does not start another connection while the client is reconnecting', async () => {
    redisMock.state.isOpen = true;
    redisMock.state.isReady = false;

    await startRedisConnection();

    expect(redisMock.connect).not.toHaveBeenCalled();
  });

  it('propagates an initial connection failure', async () => {
    redisMock.connect.mockImplementationOnce(async () => {
      redisMock.state.isOpen = false;
      throw new Error('Redis connection failed');
    });

    await expect(startRedisConnection()).rejects.toThrow(
      'Redis connection failed',
    );
  });

  it('allows another connection attempt after a terminal failure', async () => {
    redisMock.connect
      .mockImplementationOnce(async () => {
        redisMock.state.isOpen = false;
        throw new Error('Redis connection failed');
      })
      .mockImplementationOnce(async () => {
        redisMock.state.isOpen = true;
        redisMock.state.isReady = true;
      });

    await expect(startRedisConnection()).rejects.toThrow(
      'Redis connection failed',
    );

    await startRedisConnection();

    expect(redisMock.connect).toHaveBeenCalledTimes(2);
    expect(redisMock.state.isReady).toBe(true);
  });

  it('destroys the client when shutting down during connection', async () => {
    redisMock.state.isOpen = true;
    redisMock.state.isReady = false;

    await closeRedisConnection();

    expect(redisMock.destroy).toHaveBeenCalledTimes(1);
    expect(redisMock.close).not.toHaveBeenCalled();
  });

  it('gracefully closes a ready client', async () => {
    redisMock.state.isOpen = true;
    redisMock.state.isReady = true;

    await closeRedisConnection();

    expect(redisMock.close).toHaveBeenCalledTimes(1);
    expect(redisMock.destroy).not.toHaveBeenCalled();
  });

  it('does nothing when the client is already closed', async () => {
    await closeRedisConnection();

    expect(redisMock.close).not.toHaveBeenCalled();
    expect(redisMock.destroy).not.toHaveBeenCalled();
  });

  it('checks Redis readiness using PING', async () => {
    redisMock.state.isOpen = true;
    redisMock.state.isReady = true;

    await expect(checkRedisConnection()).resolves.toBeUndefined();

    expect(redisMock.ping).toHaveBeenCalledTimes(1);
  });

  it('rejects the readiness check when the client is not ready', async () => {
    await expect(checkRedisConnection()).rejects.toThrow(
      'Redis client is not ready',
    );

    expect(redisMock.ping).not.toHaveBeenCalled();
  });
});
