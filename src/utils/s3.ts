import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import httpStatus from 'http-status';
import AppError from '../error/AppError';
import config from '../config';
import { s3Client } from '../constants/aws';

import multer, { memoryStorage } from "multer";

const storage = memoryStorage();

export const image_Upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 10 /* 10 mb */ },
  fileFilter(req, file, cb) {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export const document_Upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 10 }, // 10 MB
  fileFilter(req, file, cb) {

    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'application/pdf',
    ];

    cb(null, true);
  },
});

//upload a single file
export const uploadToS3 = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { file, fileName }: { file: any; fileName: string },
): Promise<{ key: string, url: string }> => {
  
  const command = new PutObjectCommand({
    Bucket: config.aws.bucket,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  try {
    const key = await s3Client.send(command);
    if (!key) {
      throw new AppError(httpStatus.BAD_REQUEST, 'File Upload failed');
    }

    const url = `https://${config.aws.bucket}.s3.${config.aws.region}.amazonaws.com/${fileName}`;

    return { url, key: fileName };
  } catch (error) {
    throw new AppError(httpStatus.BAD_REQUEST, 'File Upload failed');
  }
};

// delete file from s3 bucket
export const deleteFromS3 = async (key: string) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: config.aws.bucket,
      Key: key,
    });
    await s3Client.send(command);
  } catch (error) {
    console.log('🚀 ~ deleteFromS3 ~ error:', error);
    throw new Error('s3 file delete failed');
  }
};

// upload multiple files

export const uploadManyToS3 = async (
  files: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    file: any;
    path: string;
    key?: string;
  }[],
): Promise<{ url: string; key: string }[]> => {
  try {

    const uploadPromises = files.map(async ({ file, path, key }) => {
      const newFileName = key
        ? key
        : `${Math.floor(100000 + Math.random() * 900000)}${Date.now()}`;

      const fileKey = `${path}/${newFileName}`;
      const command = new PutObjectCommand({
        Bucket: config.aws.bucket as string,
        Key: fileKey,
        Body: file?.buffer,
      });

      await s3Client.send(command);

      const url = `https://${config.aws.bucket}.s3.${config.aws.region}.amazonaws.com/${fileKey}`;
      return { url, key: newFileName };
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    return uploadedUrls;
  } catch (error) {
    console.log(error)
    throw new Error('File Upload failed');
  }
};

export const deleteManyFromS3 = async (keys: string[]) => {

    const deleteParams = {
      Bucket: config.aws.bucket,
      Delete: {
        Objects: keys.map(key => ({ Key: key })),
        Quiet: false,
      },
    };

    const command = new DeleteObjectsCommand(deleteParams);

    const response = await s3Client.send(command);

    return response;
};