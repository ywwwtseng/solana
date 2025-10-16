import { Connection, PublicKey, type ParsedAccountData } from '@solana/web3.js';

export async function getAccountInfo(
  connection: Connection,
  publicKey: string | PublicKey
): Promise<{ owner: string | undefined; mint: string | undefined }> {
  const accountInfo = await connection.getParsedAccountInfo(
    new PublicKey(publicKey)
  );

  const info = (accountInfo.value?.data as ParsedAccountData)?.parsed?.info;

  return { owner: info?.owner, mint: info?.mint };
}
