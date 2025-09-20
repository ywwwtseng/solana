// src/index.ts
import {
  Keypair,
  clusterApiUrl,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction
} from "@solana/web3.js";
var SolanaRPC = class _SolanaRPC {
  network;
  url;
  constructor({
    url,
    network
  }) {
    this.url = url ? url : network ? clusterApiUrl(network === "mainnet" ? "mainnet-beta" : "devnet") : void 0;
    if (!this.url) {
      throw new Error("rpcUrl or cluster is required");
    }
  }
  init({ url, network }) {
    return new _SolanaRPC({ url, network });
  }
  calculateReceived(parsedTransaction) {
    const received = [];
    for (const ix of parsedTransaction.transaction.message.instructions) {
      if ("parsed" in ix && "type" in ix.parsed) {
        const parsed = ix.parsed;
        if (parsed.type === "transfer") {
          const info = parsed.info;
          const source = info.source;
          const destination = info.destination;
          const lamports = Number(info.lamports);
          const found = received.find(
            (r) => r.destination === destination && r.source === source
          );
          if (!found) {
            received.push({ source, destination, lamports });
          } else {
            found.lamports += lamports;
          }
        }
      }
    }
    return received;
  }
  generate() {
    const wallet = Keypair.generate();
    return {
      publicKey: wallet.publicKey.toBase58(),
      privateKey: Buffer.from(wallet.secretKey).toString("hex")
    };
  }
  publicKey(privateKey) {
    const secretKey = Uint8Array.from(Buffer.from(privateKey, "hex"));
    return Keypair.fromSecretKey(secretKey).publicKey.toBase58();
  }
  async getSignaturesForAddress({
    address,
    ...configuration
  }) {
    const res = await fetch(this.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getSignaturesForAddress",
        params: [
          address,
          {
            limit: 3,
            // https://solana.com/docs/rpc#configuring-state-commitment
            commitment: "finalized",
            ...configuration
          }
        ]
      })
    });
    const data = await res.json();
    return data.result.map((s) => s.signature);
  }
  async getTransaction({ signature }) {
    const res = await fetch(this.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTransaction",
        params: [signature, { encoding: "jsonParsed" }]
      })
    });
    const data = await res.json();
    return data.result;
  }
  async getBalance({ publicKey }) {
    const connection = new Connection(this.url, "confirmed");
    return await connection.getBalance(new PublicKey(publicKey));
  }
  async sendTransaction({
    privateKey,
    destination,
    lamports
  }) {
    const connection = new Connection(this.url, "confirmed");
    const secretKey = Uint8Array.from(Buffer.from(privateKey, "hex"));
    const fromKeypair = Keypair.fromSecretKey(secretKey);
    const instruction = SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey: new PublicKey(destination),
      lamports
    });
    const transaction = new Transaction().add(instruction);
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [fromKeypair],
      { commitment: "confirmed" }
    );
    return signature;
  }
  // async confirmTransaction({ signature }: { signature: string }) {
  //   const connection = new Connection(this.rpcUrl, 'confirmed');
  //   const recentBlockhash = await connection.getLatestBlockhash();
  //   const signatureResult = await connection.confirmTransaction({
  //     blockhash: recentBlockhash.blockhash,
  //     lastValidBlockHeight: recentBlockhash.lastValidBlockHeight,
  //     signature,
  //   });
  //   return signatureResult;
  // }
};
export {
  SolanaRPC
};
