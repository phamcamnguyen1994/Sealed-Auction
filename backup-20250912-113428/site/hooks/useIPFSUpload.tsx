"use client";

import { useState, useCallback } from 'react';

interface IPFSUploadResult {
  hash: string;
  url: string;
  size: number;
}

interface IPFSUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  result: IPFSUploadResult | null;
}

export const useIPFSUpload = () => {
  const [uploadState, setUploadState] = useState<IPFSUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    result: null
  });

  const uploadToPinata = useCallback(async (file: File): Promise<IPFSUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add metadata
    formData.append('pinataMetadata', JSON.stringify({
      name: file.name,
      keyvalues: {
        type: 'auction-image',
        uploadedAt: new Date().toISOString()
      }
    }));

    // Add pinning options
    formData.append('pinataOptions', JSON.stringify({
      cidVersion: 1,
      wrapWithDirectory: false
    }));

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Pinata upload failed: ${errorData.error?.details || 'Unknown error'}`);
    }

    const result = await response.json();
    
    return {
      hash: result.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
      size: result.PinSize
    };
  }, []);

  const uploadImage = useCallback(async (file: File): Promise<IPFSUploadResult> => {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 10MB');
    }

    setUploadState({
      isUploading: true,
      progress: 0,
      error: null,
      result: null
    });

    try {
      // Simulate progress (Pinata doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      const result = await uploadToPinata(file);
      
      clearInterval(progressInterval);
      
      setUploadState({
        isUploading: false,
        progress: 100,
        error: null,
        result
      });

      return result;
    } catch (error) {
      setUploadState({
        isUploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed',
        result: null
      });
      throw error;
    }
  }, [uploadToPinata]);

  const resetUploadState = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      result: null
    });
  }, []);

  return {
    uploadImage,
    resetUploadState,
    ...uploadState
  };
};
