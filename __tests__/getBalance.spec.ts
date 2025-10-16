import { test, expect, describe, beforeAll } from 'bun:test';
import { getBalance } from '../src/getBalance';
import { wallet } from '../src/wallet';
import { Connection, endpoint } from '../src';

describe('getBalance', () => {
  let connection: Connection;

  beforeAll(() => {
    connection = new Connection(endpoint('devnet'));
  });

  test('get SOL balance', async () => {
    const balance = await getBalance(connection, {
      publicKey: wallet.publicKey,
    });

    expect(balance).toBeGreaterThan(0);
  });

  test('get USDC balance', async () => {
    // https://faucet.circle.com/
    const balance = await getBalance(connection, {
      publicKey: wallet.publicKey,
      tokenAddress: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    });

    expect(balance).toBeGreaterThan(0);
  });
});
