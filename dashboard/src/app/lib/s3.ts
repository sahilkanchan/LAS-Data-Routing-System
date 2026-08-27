import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { cacheSignedUrls, getCachedUrls } from './redis';

import { TTL } from '../../../config/ttl';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/*
 * Get signed urls for a list of keys in an S3 bucket.
 *
 * @param bucket - S3 bucket name.
 * @param keys - List of keys to get signed urls for.
 * @returns - Map of keys to signed urls.
 */
export async function getSignedS3Urls(bucket: string, keys: string[] | string): Promise<Record<string, string> | null> {
  try {
    // if keys is a string, wrap it in an array.
    const objKeys = typeof keys === 'string' ? [keys] : keys;

    // retrieve cached signed urls if available.
    const urls = await getCachedUrls(objKeys);

    // find the indices of the keys that are not cached.
    const keyIndicesToCache = []
    for (let i = 0; i < urls.length; i++) {
      if (!urls[i]) keyIndicesToCache.push(i)
    }

    // proceed to generate signed urls if there are any missing.
    if (keyIndicesToCache.length > 0) {
      // construct commands to get signed urls.
      const commands = []
      for (let i = 0; i < keyIndicesToCache.length; i++) {
        commands.push(new GetObjectCommand({ Bucket: bucket, Key: objKeys[keyIndicesToCache[i]] }))
      }

      // get signed urls via batched promise.
      const freshUrls = await Promise.all(
        commands.map((cmd) => getSignedUrl(s3, cmd, { expiresIn: TTL }))
      );

      // cache the missing signed urls.
      await cacheSignedUrls(Object.fromEntries(keyIndicesToCache.map((keyIdx, i) => [objKeys[keyIdx], freshUrls[i]])));

      // fill the missing urls.
      for (let i = 0; i < keyIndicesToCache.length; i++) {
        urls[keyIndicesToCache[i]] = freshUrls[i];
      }
    }

    // create a map of keys to urls.
    const urlMap: Record<string, string> = {};
    (urls as string[]).forEach((url, i) => {
      urlMap[objKeys[i]] = url
    })

    return urlMap;
  } catch (err) {
    console.error(err);
    return null;
  }
}
