import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { getAccount } from '@solana/spl-token';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';

export async function getBalance(
  connection: Connection,
  {
    publicKey,
    tokenAddress,
  }: {
    publicKey: string;
    tokenAddress?: string | null;
  }
) {
  if (tokenAddress) {
    const ownerATA = getAssociatedTokenAddressSync(
      new PublicKey(tokenAddress),
      new PublicKey(publicKey),
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const account = await getAccount(connection, ownerATA);

    return account.amount;
  } else {
    return await connection.getBalance(new PublicKey(publicKey));
  }
}
