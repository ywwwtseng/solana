import { test, expect, describe } from 'bun:test';
import {
  decodeTransfer,
  createTransaction,
  endpoint,
  PublicKey,
  Connection,
} from '../src';
import { wallet } from '../src/wallet';

describe('decodeTransfer', () => {
  test('decode SOL Transfer Transaction', async () => {
    const connection = new Connection(endpoint('devnet'));
    const transaction = await createTransaction(connection, {
      feePayer: wallet.publicKey,
      source: wallet.publicKey,
      destination: 'Cn9yzV2kdCQRYNUYZ4KXeD5Z7DmevUkqixjv8eaYYXfk',
      amount: '1000000',
    });

    const latestBlockhash = await connection.getLatestBlockhash();
    transaction.feePayer = new PublicKey(
      '5g1QJWjSKuP2Pd2hbRffiSKPt7qgNvHgSN3m7nzRNbBM'
    );
    transaction.recentBlockhash = latestBlockhash.blockhash;
    transaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;

    const serialized = transaction
      .serialize({ requireAllSignatures: false })
      .toString('base64');

    const transter = await decodeTransfer(connection, serialized);

    expect(transter.source).toBe(wallet.publicKey);
    expect(transter.destination).toBe(
      'Cn9yzV2kdCQRYNUYZ4KXeD5Z7DmevUkqixjv8eaYYXfk'
    );
    expect(transter.amount).toBe('1000000');
  });

  test('decode USDC Transfer Transaction', async () => {
    const connection = new Connection(endpoint('devnet'));
    const transaction = await createTransaction(connection, {
      feePayer: wallet.publicKey,
      source: wallet.publicKey,
      destination: 'Cn9yzV2kdCQRYNUYZ4KXeD5Z7DmevUkqixjv8eaYYXfk',
      amount: '1000000',
      mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    });

    const latestBlockhash = await connection.getLatestBlockhash();
    transaction.feePayer = new PublicKey(wallet.publicKey);
    transaction.recentBlockhash = latestBlockhash.blockhash;
    transaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;

    const serialized = transaction
      .serialize({ requireAllSignatures: false })
      .toString('base64');

    const transter = await decodeTransfer(connection, serialized);

    expect(transter.source).toBe(wallet.publicKey);
    expect(transter.destination).toBe(
      'Cn9yzV2kdCQRYNUYZ4KXeD5Z7DmevUkqixjv8eaYYXfk'
    );
    expect(transter.amount).toBe('1000000');
  });
});
