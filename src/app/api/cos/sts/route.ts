import { NextResponse } from 'next/server'
const STS = require('qcloud-cos-sts')

export async function GET() {
    const bucket = process.env.COS_BUCKET
    const region = process.env.COS_REGION
    const secretId = process.env.COS_SECRET_ID
    const secretKey = process.env.COS_SECRET_KEY

    if (!secretId || !secretKey || !bucket || !region) {
        return NextResponse.json({
            error: 'Server configuration missing',
            details: 'Missing one or more COS environment variables: COS_SECRET_ID, COS_SECRET_KEY, COS_BUCKET, COS_REGION'
        }, { status: 500 })
    }

    // Extract appid from bucket name (format: bucketname-appid)
    const appId = bucket.split('-').pop()
    const shortBucketName = bucket.substring(0, bucket.lastIndexOf('-'))

    const policy = {
        'version': '2.0',
        'statement': [{
            'action': [
                'name/cos:PutObject',
                'name/cos:PostObject',
                'name/cos:InitiateMultipartUpload',
                'name/cos:ListMultipartUploads',
                'name/cos:ListParts',
                'name/cos:UploadPart',
                'name/cos:CompleteMultipartUpload'
            ],
            'effect': 'allow',
            'resource': [
                `qcs::cos:${region}:uid/${appId}:${bucket}/*`
            ]
        }]
    }

    const config = {
        secretId: secretId,
        secretKey: secretKey,
        proxy: '',
        durationSeconds: 1800,
        policy: policy
    }

    return new Promise((resolve) => {
        STS.getCredential(config, (err: any, tempKeys: any) => {
            if (err) {
                console.error('STS Error Details:', JSON.stringify(err, null, 2))
                resolve(NextResponse.json({
                    error: 'Failed to get STS credentials',
                    details: err.message || err.error || String(err),
                    raw: err
                }, { status: 500 }))
            } else {
                resolve(NextResponse.json({
                    ...tempKeys,
                    bucket,
                    region
                }))
            }
        })
    })
}
