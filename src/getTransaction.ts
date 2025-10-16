import { Connection } from '@solana/web3.js';

export async function getTransaction(
  connection: Connection,
  { signature }: { signature: string }
) {
  const transaction = await connection.getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: 'finalized',
  });

  return transaction;
}
