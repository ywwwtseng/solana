import { test, expect, describe, beforeAll } from 'bun:test';
import { getSignaturesForAddress, Connection, endpoint } from '../src';
import { wallet } from '../src/wallet';

describe('getSignaturesForAddress', async () => {
  let connection: Connection;

  beforeAll(() => {
    connection = new Connection(endpoint('devnet'));
  });

  test('getSignaturesForAddress', async () => {
    const signatures = await getSignaturesForAddress(connection, {
      address: wallet.publicKey,
    });

    expect(signatures).toBeDefined();
    expect(signatures.length).toBeGreaterThan(0);
  });
});
