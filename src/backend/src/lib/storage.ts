import { DefaultAzureCredential } from '@azure/identity';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { config } from './config.js';

let blobServiceClient: BlobServiceClient | null = null;
let containerClient: ContainerClient | null = null;

export const initializeStorage = async (): Promise<void> => {
    try {
        if (config.storage.accountKey) {
            // Use account key authentication
            const connectionString = `DefaultEndpointsProtocol=https;AccountName=${config.storage.accountName};AccountKey=${config.storage.accountKey};EndpointSuffix=core.windows.net`;
            blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        } else {
            // Use Azure AD authentication
            const credential = new DefaultAzureCredential();
            blobServiceClient = new BlobServiceClient(
                `https://${config.storage.accountName}.blob.core.windows.net`,
                credential
            );
        }

        containerClient = blobServiceClient.getContainerClient(config.storage.containerName);

        // Ensure container exists
        await containerClient.createIfNotExists({
            access: 'blob', // Public read access for license documents
        });

        console.log('Azure Blob Storage initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Azure Blob Storage:', error);
        throw error;
    }
};

export const uploadFile = async (
    fileName: string,
    fileBuffer: Buffer,
    contentType: string
): Promise<string> => {
    if (!containerClient) {
        throw new Error('Storage not initialized');
    }

    try {
        const blobName = `${Date.now()}-${fileName}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
            blobHTTPHeaders: {
                blobContentType: contentType,
            },
        });

        return blockBlobClient.url;
    } catch (error) {
        console.error('File upload failed:', error);
        throw new Error('Failed to upload file to Azure Blob Storage');
    }
};

export const deleteFile = async (fileName: string): Promise<void> => {
    if (!containerClient) {
        throw new Error('Storage not initialized');
    }

    try {
        const blockBlobClient = containerClient.getBlockBlobClient(fileName);
        await blockBlobClient.deleteIfExists();
    } catch (error) {
        console.error('File deletion failed:', error);
        throw new Error('Failed to delete file from Azure Blob Storage');
    }
};

export const generateSasToken = async (fileName: string, expiresInMinutes = 60): Promise<string> => {
    if (!containerClient) {
        throw new Error('Storage not initialized');
    }

    try {
        const blockBlobClient = containerClient.getBlockBlobClient(fileName);

        // For production, implement SAS token generation
        // For now, return the direct URL (requires public access)
        return blockBlobClient.url;
    } catch (error) {
        console.error('SAS token generation failed:', error);
        throw new Error('Failed to generate SAS token');
    }
};

export const checkStorageHealth = async (): Promise<boolean> => {
    try {
        if (!blobServiceClient) {
            return false;
        }

        const properties = await blobServiceClient.getProperties();
        return !!properties;
    } catch (error) {
        console.error('Storage health check failed:', error);
        return false;
    }
};