import multer from 'multer'
import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse } from 'cloudinary'

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      callback(new Error('Only image files are allowed'))
      return
    }
    callback(null, true)
  }
})

export const uploadImageFromBuffer = (
  buffer: Buffer,
  options: UploadApiOptions = {}
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'chat-app/avatars',
        resource_type: 'image',
        transformation: [{ width: 200, height: 200, crop: 'fill' }],
        ...options
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else if (result) {
          resolve(result)
        } else {
          reject(new Error('Cloudinary did not return an upload result'))
        }
      }
    )
    uploadStream.end(buffer)
  })
}
