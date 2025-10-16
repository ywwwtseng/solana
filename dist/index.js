// src/index.ts
export * from "@solana/web3.js";

// src/KeyVaultService.ts
import crypto from "crypto";
import { Keypair } from "@solana/web3.js";
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
    const wallet = Keypair.generate();
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
    const wallet = Keypair.fromSecretKey(
      new Uint8Array(Buffer.from(decryptedHex, "hex"))
    );
    decryptedHex.replace(/./g, "0");
    return wallet;
  }
};

// src/KeyPair.ts
import { Keypair as Keypair2 } from "@solana/web3.js";
var KeyPair = class {
  static from(privateKey) {
    return Keypair2.fromSecretKey(
      privateKey instanceof Uint8Array ? privateKey : Uint8Array.from(Buffer.from(privateKey, "hex"))
    );
  }
};

// src/endpoint.ts
import { clusterApiUrl } from "@solana/web3.js";
function endpoint(src) {
  if (src === "mainnet-beta" || src === "devnet") {
    return clusterApiUrl(src);
  } else {
    return src;
  }
}

// src/getSignaturesForAddress.ts
import {
  PublicKey
} from "@solana/web3.js";
async function getSignaturesForAddress(connection, {
  address,
  ...options
}) {
  const result = await connection.getSignaturesForAddress(
    new PublicKey(address),
    {
      limit: 3,
      ...options
    },
    "finalized"
  );
  return result.map((s) => s.signature);
}

// src/getTransaction.ts
async function getTransaction(connection, { signature }) {
  const transaction = await connection.getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: "finalized"
  });
  return transaction;
}

// src/getTransfers.ts
function getTransfers(parsedTransaction) {
  const transfers = [];
  const mint = parsedTransaction.meta?.preTokenBalances?.[0]?.mint;
  if (mint) {
    const preMap = /* @__PURE__ */ new Map();
    const postMap = /* @__PURE__ */ new Map();
    const senders = [];
    const receivers = [];
    parsedTransaction.meta?.preTokenBalances?.forEach((b) => {
      if (b.owner) {
        preMap.set(`${b.mint}_${b.owner}`, b);
      }
    });
    parsedTransaction.meta?.postTokenBalances?.forEach((b) => {
      if (b.owner) {
        postMap.set(`${b.mint}_${b.owner}`, b);
      }
    });
    postMap.forEach((postBalance, key) => {
      const preBalance = preMap.get(key);
      const postAmount = Number(postBalance.uiTokenAmount.amount ?? "0");
      const preAmount = Number(preBalance?.uiTokenAmount.amount ?? "0");
      const delta = postAmount - preAmount;
      if (delta > 0) {
        receivers.push({
          mint: postBalance.mint,
          owner: postBalance.owner,
          delta
        });
      } else if (delta < 0) {
        senders.push({
          mint: postBalance.mint,
          owner: postBalance.owner,
          delta
        });
      }
    });
    receivers.forEach((receiver) => {
      const sender = senders.find((s) => s.mint === receiver.mint);
      if (!sender) return;
      transfers.push({
        mint: receiver.mint,
        source: sender.owner,
        destination: receiver.owner,
        amount: receiver.delta.toString()
      });
    });
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
            transfers.push({
              source,
              destination,
              amount: lamports.toString()
            });
          } else {
            found.amount += lamports;
          }
        }
      }
    }
  }
  return transfers;
}

// src/getBalance.ts
import { PublicKey as PublicKey2 } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { getAccount } from "@solana/spl-token";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
async function getBalance(connection, {
  publicKey,
  tokenAddress
}) {
  if (tokenAddress) {
    const ownerATA = getAssociatedTokenAddressSync(
      new PublicKey2(tokenAddress),
      new PublicKey2(publicKey),
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const account = await getAccount(connection, ownerATA);
    return account.amount;
  } else {
    return await connection.getBalance(new PublicKey2(publicKey));
  }
}

// src/createTransaction.ts
import {
  PublicKey as PublicKey3,
  Transaction,
  SystemProgram
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync as getAssociatedTokenAddressSync2,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID as TOKEN_PROGRAM_ID2,
  ASSOCIATED_TOKEN_PROGRAM_ID as ASSOCIATED_TOKEN_PROGRAM_ID2
} from "@solana/spl-token";
async function hasAta(connection, mintAddress, ownerAddress) {
  const ata = getAssociatedTokenAddressSync2(
    new PublicKey3(mintAddress),
    new PublicKey3(ownerAddress)
  );
  const accountInfo = await connection.getAccountInfo(ata);
  return accountInfo !== null;
}
function createAtaInstruction(payer, mint, owner) {
  const ata = getAssociatedTokenAddressSync2(mint, owner);
  return createAssociatedTokenAccountInstruction(
    payer,
    // 誰出 SOL 來建 ATA
    ata,
    // ATA 地址
    owner,
    // ATA 的持有者 (接收方)
    mint,
    // Token Mint
    TOKEN_PROGRAM_ID2,
    ASSOCIATED_TOKEN_PROGRAM_ID2
  );
}
async function createSolanaTransaction({
  source,
  destination,
  amount
}) {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: new PublicKey3(source),
      toPubkey: new PublicKey3(destination),
      lamports: Number(amount)
    })
  );
  return transaction;
}
async function createTokenTransaction(connection, {
  feePayer,
  source,
  destination,
  amount,
  mint
}) {
  const fromPayerATA = getAssociatedTokenAddressSync2(
    new PublicKey3(mint),
    new PublicKey3(source),
    false,
    TOKEN_PROGRAM_ID2,
    ASSOCIATED_TOKEN_PROGRAM_ID2
  );
  const hasRecipientATA = await hasAta(connection, mint, destination);
  const instructions = [];
  if (!hasRecipientATA) {
    instructions.push(
      createAtaInstruction(
        new PublicKey3(feePayer),
        new PublicKey3(mint),
        new PublicKey3(destination)
      )
    );
  }
  const recipientATA = getAssociatedTokenAddressSync2(
    new PublicKey3(mint),
    new PublicKey3(destination),
    false,
    TOKEN_PROGRAM_ID2,
    ASSOCIATED_TOKEN_PROGRAM_ID2
  );
  instructions.push(
    createTransferInstruction(
      fromPayerATA,
      recipientATA,
      new PublicKey3(feePayer),
      Number(amount),
      [],
      TOKEN_PROGRAM_ID2
    )
  );
  const transaction = new Transaction().add(...instructions);
  return transaction;
}
function createTransaction(connection, {
  feePayer,
  source,
  destination,
  amount,
  mint
}) {
  if (mint) {
    return createTokenTransaction(connection, {
      feePayer,
      source,
      destination,
      amount,
      mint
    });
  } else {
    return createSolanaTransaction({
      source,
      destination,
      amount
    });
  }
}

// src/decodeTransfer.ts
import {
  SystemProgram as SystemProgram2,
  Transaction as Transaction2,
  SystemInstruction
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID as ASSOCIATED_TOKEN_PROGRAM_ID3,
  TOKEN_PROGRAM_ID as TOKEN_PROGRAM_ID3,
  decodeTransferInstruction
} from "@solana/spl-token";

// src/getAccountInfo.ts
import { PublicKey as PublicKey4 } from "@solana/web3.js";
async function getAccountInfo(connection, publicKey) {
  const accountInfo = await connection.getParsedAccountInfo(
    new PublicKey4(publicKey)
  );
  const info = accountInfo.value?.data?.parsed?.info;
  return { owner: info?.owner, mint: info?.mint };
}

// src/decodeTransfer.ts
async function decodeTransfer(connection, base64) {
  const tx = Transaction2.from(Buffer.from(base64, "base64"));
  if (tx.instructions.length === 1 && tx.instructions[0].programId.equals(SystemProgram2.programId)) {
    const ix = tx.instructions[0];
    const parsed = SystemInstruction.decodeTransfer(ix);
    const source = parsed.fromPubkey.toBase58();
    const destination = parsed.toPubkey.toBase58();
    const amount = parsed.lamports.toString();
    return {
      source,
      destination,
      amount
    };
  } else if (tx.instructions.length === 1 && tx.instructions[0].programId.equals(TOKEN_PROGRAM_ID3)) {
    const ix = tx.instructions[0];
    const parsed = decodeTransferInstruction(ix);
    const amount = parsed.data.amount.toString();
    const sourceInfo = await getAccountInfo(
      connection,
      parsed.keys.source.pubkey
    );
    const destinationInfo = await getAccountInfo(
      connection,
      parsed.keys.destination.pubkey
    );
    return {
      source: sourceInfo.owner,
      destination: destinationInfo.owner,
      amount,
      mint: sourceInfo.mint
    };
  } else if (tx.instructions.length === 2) {
    const cata_ix = tx.instructions.find(
      (ix2) => ix2.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID3)
    );
    const ix = tx.instructions.find(
      (ix2) => ix2.programId.equals(TOKEN_PROGRAM_ID3)
    );
    if (ix) {
      const parsed = decodeTransferInstruction(ix);
      const amount = parsed.data.amount.toString();
      const sourceInfo = await getAccountInfo(
        connection,
        parsed.keys.source.pubkey
      );
      return {
        source: sourceInfo.owner,
        destination: cata_ix.keys[2].pubkey.toBase58(),
        amount,
        mint: sourceInfo.mint
      };
    }
  }
  throw new Error("Invalid transfer transaction");
}
export {
  KeyPair,
  KeyVaultService,
  createAtaInstruction,
  createSolanaTransaction,
  createTokenTransaction,
  createTransaction,
  decodeTransfer,
  endpoint,
  getBalance,
  getSignaturesForAddress,
  getTransaction,
  getTransfers,
  hasAta
};
