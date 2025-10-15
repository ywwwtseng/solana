import crypto from 'crypto';
import { Keypair } from '@solana/web3.js';

const IV_LENGTH = 16; // AES-GCM 建議 12~16 bytes

export class KeyVaultService {
  private encryptionKey: string;
  constructor(encryptionKey: string) {
    this.encryptionKey = encryptionKey;
  }

  encryptPrivateKey(hexPrivateKey: string) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      Buffer.from(this.encryptionKey, 'hex').toString('hex'), // Explicitly cast to Uint8Array to satisfy strict type checking
      iv.toString('hex')
    );
    let encrypted = cipher.update(hexPrivateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${encrypted}:${tag}`;
  }

  decryptPrivateKey(encrypted: string) {
    const [ivHex, encryptedHex, tagHex] = encrypted.split(':');
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(this.encryptionKey, 'hex').toString('hex'),
      Buffer.from(ivHex, 'hex').toString('hex')
    );
    decipher.setAuthTag(new Uint8Array(Buffer.from(tagHex, 'hex')));
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // 生成新錢包，並加密私鑰
  generateWallet() {
    const wallet = Keypair.generate();
    const hexPrivateKey = Buffer.from(wallet.secretKey).toString('hex');
    const encryptedPrivateKey = this.encryptPrivateKey(hexPrivateKey);

    // 模擬儲存到 DB
    const record = {
      publicKey: wallet.publicKey.toBase58(),
      privateKeyEncrypted: encryptedPrivateKey,
    };

    return record;
  }

  // 使用加密私鑰還原錢包
  loadWallet(encryptedPrivateKey: string) {
    const decryptedHex = this.decryptPrivateKey(encryptedPrivateKey);
    const wallet = Keypair.fromSecretKey(
      new Uint8Array(Buffer.from(decryptedHex, 'hex'))
    );

    // 清理解密結果在記憶體的副本
    decryptedHex.replace(/./g, '0'); // 立即覆寫
    return wallet;
  }
}
