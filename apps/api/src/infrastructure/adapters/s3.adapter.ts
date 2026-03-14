import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Adapter {
    private s3: S3Client;

    constructor() {
        this.s3 = new S3Client({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy-key-id',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy-secret-key',
            }
        });
    }

    async uploadFile(bucketName: string, key: string, body: Buffer): Promise<void> {
        await this.s3.send(
            new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: body,
            })
        );
    }

    async generatePresignedUrl(bucketName: string, key: string, contentType: string, expirationSeconds: number = 300): Promise<string> {
        // Virtual S3 Provider Local Fallback
        const accessKey = process.env.AWS_ACCESS_KEY_ID;
        if (!accessKey || accessKey === 'dummy-key-id' || accessKey === 'YOUR_AWS_ACCESS_KEY_HERE') {
            return `http://localhost:3001/api/uploads/${key}`;
        }

        // Live AWS S3 Presign Route
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: contentType,
            Metadata: {
                'x-amz-meta-type': 'festival-banner',
            }
        });
        return await getSignedUrl(this.s3, command, { expiresIn: expirationSeconds });
    }
}
