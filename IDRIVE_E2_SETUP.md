# iDrive E2 Storage Setup Guide

This project uses iDrive E2 for distributed file storage across 3 storage accounts for redundancy and load balancing.

## Required Secrets

You need to configure 6 secrets in your Supabase project:

1. `IDRIVEE2_ACCESS_KEY_1` - Access key for storage account 1
2. `IDRIVEE2_SECRET_KEY_1` - Secret key for storage account 1
3. `IDRIVEE2_ACCESS_KEY_2` - Access key for storage account 2
4. `IDRIVEE2_SECRET_KEY_2` - Secret key for storage account 2
5. `IDRIVEE2_ACCESS_KEY_3` - Access key for storage account 3
6. `IDRIVEE2_SECRET_KEY_3` - Secret key for storage account 3

## How to Get iDrive E2 Credentials

1. Go to [iDrive E2](https://www.idrive.com/object-storage-e2/)
2. Sign up for 3 separate accounts (or create 3 access keys in one account)
3. Navigate to "Access Keys" in your dashboard
4. Create access keys for each account
5. Copy the Access Key and Secret Key for each

## Setting Up Buckets (CRITICAL STEP!)

⚠️ **You MUST create the bucket before uploads will work!**

You need to create a bucket named `media-files` in each of your 3 iDrive E2 accounts:

1. Log into iDrive E2 console
2. Navigate to "Buckets"
3. Click "Create Bucket"
4. Name it: `media-files`
5. Region: `ap-southeast-1` (Singapore)
6. Make it **public** (for serving images/videos)
7. Repeat for all 3 accounts

## Configure Supabase Secrets

Update the secrets in your Supabase project:

```bash
# Navigate to: https://supabase.com/dashboard/project/zmdqloustkrtaeumkrau/settings/functions
# Or use Lovable to update the secrets
```

## Testing the Upload

1. Try uploading a profile picture from `/settings`
2. Check the browser console for upload progress
3. Check Supabase Edge Function logs for detailed information:
   - https://supabase.com/dashboard/project/zmdqloustkrtaeumkrau/functions/upload-to-idrivee2/logs

## How It Works

- **Load Balancing**: Each upload randomly selects one of the 3 storage accounts
- **Redundancy**: Files are distributed across multiple accounts
- **Public Access**: All uploads are publicly accessible via direct URLs
- **Automatic Path Generation**: Files are organized by upload type (e.g., `profile-images/user-id/`)

## Supported Upload Paths

- `profile-images/{user-id}` - User profile and cover photos
- `media` - General media files (admin uploads)
- `uploads` - General uploads

## Troubleshooting

### Upload Fails with "Storage credentials not properly configured"
- One or more secrets are missing or empty
- Update all 6 secrets in Supabase

### Upload Fails with S3 Error
- Check that buckets are created and named `media-files`
- Verify bucket is public
- Verify region is `ap-southeast-1`
- Check access key permissions

### Images Don't Display
- Verify bucket is set to **public**
- Check CORS settings in iDrive E2 console
- Verify the URL format: `https://media-files.s3.ap-southeast-1.idrivee2.com/path/to/file.jpg`

## Monitoring

Check upload statistics and errors:
- Edge Function Logs: https://supabase.com/dashboard/project/zmdqloustkrtaeumkrau/functions/upload-to-idrivee2/logs
- Browser Console: F12 → Console tab
- Network Tab: F12 → Network tab (filter by "upload-to-idrivee2")
