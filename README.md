# Solana

Solana JavaScript SDK

### createTransaction example

```ts
async function sendTransaction({
  privateKey,
  destination,
  tokenAddress,
  amount,
}: {
  privateKey: string;
  destination: string;
  tokenAddress?: string | null;
  amount: number;
}) {
  const keyPair = KeyPair.from(privateKey);

  const connection = new Connection(endpoint('mainnet-beta'));

  const transaction = await createTransaction(connection, {
    feePayer: keyPair.publicKey,
    source: keyPair.publicKey,
    destination,
    amount,
    mint: tokenAddress,
  });

  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [keyPair],
    { commitment: 'confirmed' }
  );

  return signature;
}
```

### createTransaction example

```ts
async function createTransaction({
  privateKey,
  feePayer,
  source,
  destination,
  tokenAddress,
  amount,
}: {
  privateKey: string;
  feePayer: string;
  source: string;
  destination: string;
  tokenAddress?: string | null;
  amount: number;
}) {
  const keyPair = KeyPair.from(privateKey);

  const connection = new Connection(endpoint('mainnet-beta'));

  const transaction = await createTransaction(connection, {
    feePayer,
    source,
    destination,
    amount,
    mint: tokenAddress,
  });

  const latestBlockhash = await connection.getLatestBlockhash();
  transaction.feePayer = new solana.PublicKey(feePayer);
  transaction.recentBlockhash = latestBlockhash.blockhash;
  transaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;

  transaction.partialSign(keyPair);

  // 將交易序列化，發給前端或後端簽署
  const serialized = transaction
    .serialize({ requireAllSignatures: false })
    .toString('base64');

  return serialized;
}
```
