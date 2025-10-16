import { test, expect } from 'bun:test';
import {
  type ParsedTransactionWithMeta,
  getTransaction,
  Connection,
  endpoint,
  getTransfers,
} from '../src';

const connection = new Connection(endpoint('devnet'));

test('getTransaction', async () => {
  const transaction = await getTransaction(connection, {
    signature:
      '295q29VLXDbL4TkvNmxSqfX6i1B1nQhXu4U9ZZc2xkFp5U1cniPmGDfugaMNpGMyJPk4fPGd7e9PJZjpJU8KjK6K',
  });
  expect(transaction).toBeDefined();

  const transfers = getTransfers(
    transaction as unknown as ParsedTransactionWithMeta
  );

  expect(transfers.length).toBe(1);
  // circle faucet address
  expect(transfers[0].source).toBe(
    'H3sjyipQtXAJkvWNkXhDgped7k323kAba8QMwCLcV79w'
  );

  expect(transfers[0].destination).toBe(
    'HSb2Krq5gAD8syfgwikbiF4iJzVXwxU41p6By34Zh5nK'
  );
  expect(transfers[0].amount).toBe('10000000');
});
