import { test, expect, describe } from 'bun:test';
import type { ParsedTransactionWithMeta } from '@solana/web3.js';
import { parseTransfers } from '../src/utils';
import { parsedTransaction } from './constants';

describe('SolanaRPC', () => {
  test('parseTransfers', () => {
    const transfer = parseTransfers(
      parsedTransaction as unknown as ParsedTransactionWithMeta
    );

    expect(transfer).toBeDefined();
    expect(transfer.length).toBe(1);
    expect(transfer[0].source).toBe(
      'Cn9yzV2kdCQRYNUYZ4KXeD5Z7DmevUkqixjv8eaYYXfk'
    );
    expect(transfer[0].destination).toBe(
      '5g1QJWjSKuP2Pd2hbRffiSKPt7qgNvHgSN3m7nzRNbBM'
    );
    expect(transfer[0].amount).toBe(200000);
  });
});
