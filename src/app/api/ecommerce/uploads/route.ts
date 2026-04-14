import { NextRequest, NextResponse } from 'next/server'
import {
  ACCEPTED_ECOMMERCE_MIME_TYPES,
  MAX_ECOMMERCE_UPLOAD_BYTES,
  MAX_ECOMMERCE_UPLOADS,
  getReadableFileSize,
  isAcceptedEcommerceMimeType,
} from '@/lib/ecommerce-uploads'
import { uploadSourceImage } from '@/lib/storage'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files')
    const clientIds = formData.getAll('clientIds').map(value => String(value))

    const imageFiles = files.filter((value): value is File => value instanceof File)

    if (imageFiles.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
    }

    if (imageFiles.length > MAX_ECOMMERCE_UPLOADS) {
      return NextResponse.json(
        { error: `Upload up to ${MAX_ECOMMERCE_UPLOADS} images per job` },
        { status: 400 }
      )
    }

    if (clientIds.length !== imageFiles.length) {
      return NextResponse.json({ error: 'Upload metadata mismatch' }, { status: 400 })
    }

    for (const file of imageFiles) {
      if (!isAcceptedEcommerceMimeType(file.type)) {
        return NextResponse.json(
          { error: `Unsupported file type. Use ${ACCEPTED_ECOMMERCE_MIME_TYPES.join(', ')}` },
          { status: 400 }
        )
      }

      if (file.size > MAX_ECOMMERCE_UPLOAD_BYTES) {
        return NextResponse.json(
          { error: `Each file must be ${getReadableFileSize(MAX_ECOMMERCE_UPLOAD_BYTES)} or smaller` },
          { status: 400 }
        )
      }
    }

    const uploads = await Promise.all(
      imageFiles.map((file, index) => uploadSourceImage(file, clientIds[index] || crypto.randomUUID()))
    )

    return NextResponse.json({ uploads })
  } catch (error) {
    console.error('[POST /api/ecommerce/uploads] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
