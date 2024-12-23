// src/lib/zk/encryption.ts
import { box, randomBytes } from 'tweetnacl';
import type { EncryptionKeys, EncryptedData } from '../../types/zk';

export class ZKEncryption {
  private static instance: ZKEncryption;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  private constructor() {}

  static getInstance(): ZKEncryption {
    if (!ZKEncryption.instance) {
      ZKEncryption.instance = new ZKEncryption();
    }
    return ZKEncryption.instance;
  }

  generateKeys(): EncryptionKeys {
    const keypair = box.keyPair();
    return {
      publicKey: keypair.publicKey,
      privateKey: keypair.secretKey
    };
  }

  encrypt(message: string, recipientPublicKey: Uint8Array, senderPrivateKey: Uint8Array): EncryptedData {
    const nonce = randomBytes(box.nonceLength);
    const messageUint8 = this.encoder.encode(message);
    const encryptedMessage = box(
      messageUint8,
      nonce,
      recipientPublicKey,
      senderPrivateKey
    );

    return {
      data: this.toBase64(new Uint8Array(encryptedMessage)),
      nonce: this.toBase64(nonce)
    };
  }

  decrypt(encryptedData: EncryptedData, senderPublicKey: Uint8Array, recipientPrivateKey: Uint8Array): string {
    const decryptedMessage = box.open(
      this.fromBase64(encryptedData.data),
      this.fromBase64(encryptedData.nonce),
      senderPublicKey,
      recipientPrivateKey
    );

    if (!decryptedMessage) {
      throw new Error('Failed to decrypt message');
    }

    return this.decoder.decode(decryptedMessage);
  }

  toBase64(buffer: Uint8Array): string {
    return btoa(String.fromCharCode(...buffer));
  }

  fromBase64(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

export const zkEncryption = ZKEncryption.getInstance();