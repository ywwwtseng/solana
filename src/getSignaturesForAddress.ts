import {
  Connection,
  PublicKey,
  SignaturesForAddressOptions,
} from '@solana/web3.js';

export async function getSignaturesForAddress(
  connection: Connection,
  {
    address,
    ...options
  }: {
    address: string;
  } & SignaturesForAddressOptions
) {
  const result = await connection.getSignaturesForAddress(
    new PublicKey(address),
    {
      limit: 3,
      ...options,
    },
    'finalized'
  );

  return result.map((s) => s.signature);
}
