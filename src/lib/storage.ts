import fs from 'fs/promises';
import path from 'path';

const S3_BUCKET = process.env.S3_BUCKET;
const S3_REGION = process.env.S3_REGION;
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY;
const S3_SECRET_KEY = process.env.S3_SECRET_KEY;

let s3Client: any = null;
let getSignedUrlFunc: any = null;

async function initS3() {
  if (!S3_BUCKET || !S3_REGION) return;
  if (s3Client) return;
  try {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    s3Client = new S3Client({ region: S3_REGION, credentials: S3_ACCESS_KEY && S3_SECRET_KEY ? { accessKeyId: S3_ACCESS_KEY, secretAccessKey: S3_SECRET_KEY } : undefined });
    // Attach PutObjectCommand for use
    (s3Client as any).PutObjectCommand = PutObjectCommand;
    getSignedUrlFunc = getSignedUrl;
  } catch (err) {
    console.warn('S3 SDK not available:', err);
    s3Client = null;
  }
}

export async function uploadBuffer(key: string, buffer: Buffer, contentType = 'application/pdf') {
  await initS3();
  if (s3Client) {
    const PutObjectCommand = (s3Client as any).PutObjectCommand;
    await s3Client.send(new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: buffer, ContentType: contentType }));
    return { key, url: `s3://${S3_BUCKET}/${key}` };
  }

  // fallback to local filesystem
  const dir = path.join(process.cwd(), 'public', 'uploads', path.dirname(key));
  await fs.mkdir(dir, { recursive: true });
  const filename = path.join(process.cwd(), 'public', 'uploads', key);
  await fs.writeFile(filename, buffer);
  return { key, url: `/uploads/${key}` };
}

export async function getDownloadUrl(key: string, expiresSeconds = 60 * 60 * 24) {
  await initS3();
  if (s3Client && getSignedUrlFunc) {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
    try {
      const signed = await getSignedUrlFunc(s3Client, cmd, { expiresIn: expiresSeconds });
      return signed;
    } catch (err) {
      console.error('Failed to create signed url', err);
      return `s3://${S3_BUCKET}/${key}`;
    }
  }
  // local fallback
  return `/uploads/${key}`;
}
