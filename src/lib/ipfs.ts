// src/lib/ipfs.ts
import { create } from 'ipfs-http-client';
import type { FileUploadResult } from '../types';
import type { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

const ipfs = create({
  url: 'http://127.0.0.1:5001/api/v0'
});

export async function uploadToIPFS(
  file: File, 
  wallet: PhantomWalletAdapter | null,
  onProgress?: (progress: number) => void
): Promise<FileUploadResult> {
  if (!wallet?.publicKey) {
    throw new Error("Wallet not connected");
  }

  try {
    if (onProgress) onProgress(10);

    // Dosya içeriğini oku
    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);

    if (onProgress) onProgress(30);

    // Metadata oluştur
    const metadata = {
      name: file.name,
      type: file.type,
      size: file.size,
      userAddress: wallet.publicKey.toString(),
      timestamp: new Date().toISOString()
    };

    // Dosyayı IPFS'e yükle
    const fileResult = await ipfs.add(data, {
      progress: (prog) => {
        const progress = Math.round((prog / file.size) * 100);
        if (onProgress) onProgress(30 + (progress * 0.6));
        console.log(`Upload progress: ${progress}%`);
      }
    });

    // Metadata'yı IPFS'e yükle
    const metadataResult = await ipfs.add(JSON.stringify(metadata));

    if (onProgress) onProgress(100);

    // FileUploadResult objesi oluştur
    const result: FileUploadResult = {
      hash: fileResult.path,
      fileName: file.name,
      size: formatFileSize(file.size),
      publicUrl: `http://localhost:8080/ipfs/${fileResult.path}`,
      backupUrl: `https://ipfs.io/ipfs/${fileResult.path}`,
      fileType: file.type,
      uploadTime: new Date().toISOString(),
      metadataCid: metadataResult.path
    };

    return result;

  } catch (error) {
    console.error('IPFS upload error:', error);
    if (error instanceof Error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
    throw new Error('Unknown upload error occurred');
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KiB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}