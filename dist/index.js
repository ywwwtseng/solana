// src/SolanaRPC.ts
import {
  Keypair,
  clusterApiUrl,
  Connection as Connection2,
  PublicKey as PublicKey2,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import {
  getMint,
  createTransferInstruction,
  getAssociatedTokenAddressSync as getAssociatedTokenAddressSync2,
  getAccount,
  TOKEN_PROGRAM_ID as TOKEN_PROGRAM_ID2,
  ASSOCIATED_TOKEN_PROGRAM_ID as ASSOCIATED_TOKEN_PROGRAM_ID2
} from "@solana/spl-token";

// src/utils.ts
import {
  PublicKey
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from "@solana/spl-token";
function parseTransfers(parsedTransaction) {
  const transfers = [];
  const mint = parsedTransaction.meta?.preTokenBalances?.[0]?.mint;
  if (mint) {
    let source;
    let destination;
    let amount;
    parsedTransaction.meta?.preTokenBalances?.forEach((preBalance) => {
      const preAmount = preBalance?.uiTokenAmount.amount || "0";
      const postAmount = parsedTransaction.meta?.postTokenBalances?.find(
        (postBalance) => postBalance.mint === mint && postBalance.owner === preBalance.owner
      )?.uiTokenAmount.amount || "0";
      const change = Number(postAmount) - Number(preAmount);
      if (change > 0) {
        destination = preBalance.owner;
        amount = change;
      } else if (change < 0) {
        source = preBalance.owner;
      }
    });
    if (source && destination && amount) {
      transfers.push({ source, destination, amount, mint });
    }
  } else {
    for (const ix of parsedTransaction.transaction.message.instructions) {
      if ("parsed" in ix) {
        const parsed = ix.parsed;
        if (parsed.type === "transfer") {
          const info = parsed.info;
          const source = info.source;
          const destination = info.destination;
          const lamports = Number(info.lamports);
          const found = transfers.find(
            (r) => r.destination === destination && r.source === source
          );
          if (!found) {
            transfers.push({ source, destination, amount: lamports });
          } else {
            found.amount += lamports;
          }
        }
      }
    }
  }
  return transfers;
}
async function hasAta(connection, mintAddress, ownerAddress) {
  const ata = getAssociatedTokenAddressSync(
    new PublicKey(mintAddress),
    new PublicKey(ownerAddress)
  );
  const accountInfo = await connection.getAccountInfo(ata);
  return accountInfo !== null;
}
function createAtaInstruction(payer, mint, owner) {
  const ata = getAssociatedTokenAddressSync(mint, owner);
  return createAssociatedTokenAccountInstruction(
    payer,
    // 誰出 SOL 來建 ATA
    ata,
    // ATA 地址
    owner,
    // ATA 的持有者 (接收方)
    mint,
    // Token Mint
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
}

// src/SolanaRPC.ts
var SolanaRPC = class _SolanaRPC {
  network;
  url;
  connection;
  constructor({
    url,
    network
  }) {
    this.url = url ? url : network ? clusterApiUrl(network === "mainnet" ? "mainnet-beta" : "devnet") : void 0;
    if (!this.url) {
      throw new Error("rpcUrl or cluster is required");
    }
    this.connection = new Connection2(this.url, "confirmed");
  }
  init({ url, network }) {
    return new _SolanaRPC({ url, network });
  }
  async getSignaturesForAddress({
    address,
    ...configuration
  }) {
    if (!this.url) {
      throw new Error("rpcUrl or cluster is required");
    }
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
  async getBalance({
    publicKey,
    tokenAddress
  }) {
    if (tokenAddress) {
      const ownerATA = getAssociatedTokenAddressSync2(
        new PublicKey2(tokenAddress),
        new PublicKey2(publicKey),
        false,
        TOKEN_PROGRAM_ID2,
        ASSOCIATED_TOKEN_PROGRAM_ID2
      );
      const account = await getAccount(this.connection, ownerATA);
      return account.amount;
    } else {
      return await this.connection.getBalance(new PublicKey2(publicKey));
    }
  }
  async sendTransaction({
    privateKey,
    destination,
    tokenAddress,
    amount
  }) {
    const secretKey = Uint8Array.from(Buffer.from(privateKey, "hex"));
    const fromKeyPair = Keypair.fromSecretKey(secretKey);
    const feePayer = fromKeyPair.publicKey;
    if (tokenAddress) {
      const mint = new PublicKey2(tokenAddress);
      const feePayerATA = getAssociatedTokenAddressSync2(
        mint,
        feePayer,
        false,
        TOKEN_PROGRAM_ID2,
        ASSOCIATED_TOKEN_PROGRAM_ID2
      );
      const hasRecipientATA = await hasAta(
        this.connection,
        tokenAddress,
        destination
      );
      const instructions = [];
      if (!hasRecipientATA) {
        instructions.push(
          createAtaInstruction(feePayer, mint, new PublicKey2(destination))
        );
      }
      const recipientATA = getAssociatedTokenAddressSync2(
        mint,
        new PublicKey2(destination),
        false,
        TOKEN_PROGRAM_ID2,
        ASSOCIATED_TOKEN_PROGRAM_ID2
      );
      instructions.push(
        createTransferInstruction(
          feePayerATA,
          recipientATA,
          feePayer,
          amount,
          [],
          TOKEN_PROGRAM_ID2
        )
      );
      const transaction = new Transaction().add(...instructions);
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [fromKeyPair],
        { commitment: "confirmed" }
      );
      return signature;
    } else {
      const instruction = SystemProgram.transfer({
        fromPubkey: feePayer,
        toPubkey: new PublicKey2(destination),
        lamports: amount
      });
      const transaction = new Transaction().add(instruction);
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [fromKeyPair],
        { commitment: "confirmed" }
      );
      return signature;
    }
  }
  async getMint({ mint }) {
    return await getMint(this.connection, new PublicKey2(mint));
  }
};

// src/KeyVaultService.ts
import crypto from "crypto";
import { Keypair as Keypair2 } from "@solana/web3.js";
var IV_LENGTH = 16;
var KeyVaultService = class {
  encryptionKey;
  constructor(encryptionKey) {
    this.encryptionKey = encryptionKey;
  }
  encryptPrivateKey(hexPrivateKey) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      Buffer.from(this.encryptionKey, "hex").toString("hex"),
      // Explicitly cast to Uint8Array to satisfy strict type checking
      iv.toString("hex")
    );
    let encrypted = cipher.update(hexPrivateKey, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${encrypted}:${tag}`;
  }
  decryptPrivateKey(encrypted) {
    const [ivHex, encryptedHex, tagHex] = encrypted.split(":");
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      Buffer.from(this.encryptionKey, "hex").toString("hex"),
      Buffer.from(ivHex, "hex").toString("hex")
    );
    decipher.setAuthTag(new Uint8Array(Buffer.from(tagHex, "hex")));
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }
  // 生成新錢包，並加密私鑰
  generateWallet() {
    const wallet = Keypair2.generate();
    const hexPrivateKey = Buffer.from(wallet.secretKey).toString("hex");
    const encryptedPrivateKey = this.encryptPrivateKey(hexPrivateKey);
    const record = {
      publicKey: wallet.publicKey.toBase58(),
      privateKeyEncrypted: encryptedPrivateKey
    };
    return record;
  }
  // 使用加密私鑰還原錢包
  loadWallet(encryptedPrivateKey) {
    const decryptedHex = this.decryptPrivateKey(encryptedPrivateKey);
    const wallet = Keypair2.fromSecretKey(
      new Uint8Array(Buffer.from(decryptedHex, "hex"))
    );
    decryptedHex.replace(/./g, "0");
    return wallet;
  }
};
export {
  KeyVaultService,
  SolanaRPC,
  createAtaInstruction,
  hasAta,
  parseTransfers
};
