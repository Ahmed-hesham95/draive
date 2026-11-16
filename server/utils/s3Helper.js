import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, ListObjectVersionsCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { BUCKET_NAME, client } from "../config/s3.js"
import {getSignedUrl} from "@aws-sdk/s3-request-presigner"


// Upload file to Neon object Storge
export const uploadToStorage = async (fileBuffer, Key, mimeType) => {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: Key,
        Body: fileBuffer,
        ContentType: mimeType
    });
    await client.send(command)
    return {s3Key: Key};
}

// Get presigned downlowd/preview for a file (valid for 10 hour)
export const getSignedFileUrl = async (Key) => {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: Key
    });
    return await getSignedUrl(client, command, {expiresIn: 36000})
}

// Permanently delete an object and its versions from Neon object Storage
export const deleteFromStorage = async (Key) => {
    if (!Key) return;
    try {
        const {Versions = [], DeleteMarkers = []} = await client.send(
            new ListObjectVersionsCommand({Bucket: BUCKET_NAME, Prefix: Key})
        )
        const Objects = [...Versions, ...DeleteMarkers].filter((v)=>v.Key === Key).
        map(({Key, VersionId})=>({Key, VersionId}))

        if (Objects.length > 0) {
            await client.send(new DeleteObjectsCommandCommand({
                Bucket: BUCKET_NAME,
                Delete: {Objects}
            }))
        }else{
            await client.send(new DeleteObjectCommand({
                Bucket: BUCKET_NAME,
                Key: Key
            }))
        }

    } catch (err) {
        try {
            await client.send(new DeleteObjectCommand({
                Bucket: BUCKET_NAME,
                Key: Key
            }))
        } catch (fallbackErr) {
            console.error("[Storage Delete Error]:", fallbackErr.message)
            throw fallbackErr;
        }
    }
}

// Batch permanently delete multiple keys from Neon object Storage
export const deleteMultipleFromStorage = async (Keys) => {
    if (!Keys.length) return;
    await Promise.all(Keys.map(deleteFromStorage))
}

