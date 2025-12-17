import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { S3Client } from "https://deno.land/x/s3_lite_client@0.7.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Storage configuration
const ENDPOINT = 's3.ap-southeast-1.idrivee2.com';
const REGION = 'ap-southeast-1';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== iDrive E2 Upload Request Started ===');
    
    const accessKey = Deno.env.get('IDRIVEE2_ACCESS_KEY_1');
    const secretKey = Deno.env.get('IDRIVEE2_SECRET_KEY_1');
    
    if (!accessKey || !secretKey) {
      throw new Error('Storage credentials not configured. Please set IDRIVEE2_ACCESS_KEY_1 and IDRIVEE2_SECRET_KEY_1 secrets.');
    }
    
    // Get authorization header for user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const requestedBucket = formData.get('bucket') as string;
    const path = formData.get('path') as string || '';
    const fileCategory = formData.get('category') as string || 'general';

    // Security: whitelist allowed buckets
    const allowedBuckets = ['media-files'];
    const bucketName = allowedBuckets.includes(requestedBucket) ? requestedBucket : 'media-files';

    if (!file) {
      console.error('No file provided in request');
      throw new Error('No file provided');
    }

    // Security: validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.type)) {
      throw new Error(`Invalid file type: ${file.type}. Only JPEG, PNG, and WEBP images are allowed.`);
    }

    // Security: validate file size (10MB max)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of 10MB.`);
    }

    console.log(`File details:`, {
      name: file.name,
      size: file.size,
      type: file.type,
      bucket: bucketName,
      path: path
    });

    console.log(`Access key prefix: ${accessKey.substring(0, 8)}...`);

    // Create S3 client
    const s3Client = new S3Client({
      endPoint: ENDPOINT,
      region: REGION,
      accessKey: accessKey,
      secretKey: secretKey,
      useSSL: true,
      pathStyle: false,
      bucket: bucketName,
    });

    console.log(`S3 Client configured for endpoint: ${ENDPOINT}`);

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${fileExt}`;
    const fullPath = path ? `${path}/${fileName}` : fileName;

    console.log(`Generated path: ${fullPath}`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    console.log(`File converted to buffer, size: ${buffer.length} bytes`);

    // Upload to iDriveE2
    console.log('Starting upload to iDriveE2...');
    
    await s3Client.putObject(fullPath, buffer, {
      metadata: {
        'content-type': file.type,
      },
    });
    
    console.log(`✓ Upload successful`);

    // Store file metadata in database
    const { error: dbError } = await supabase
      .from('media_files')
      .insert({
        user_id: user.id,
        file_path: fullPath,
        bucket_name: bucketName,
        storage_account: 1,
        file_size: file.size,
        content_type: file.type,
        file_category: fileCategory,
      });

    if (dbError) {
      console.error('Failed to save file metadata:', dbError);
      throw new Error('Failed to save file metadata: ' + dbError.message);
    }

    // Private bucket - no public URL, use signed URLs for access
    console.log(`Path: ${fullPath}`);
    console.log(`Bucket: ${bucketName} (private)`);
    console.log('=== iDrive E2 Upload Completed ===');

    return new Response(
      JSON.stringify({
        success: true,
        path: fullPath,
        bucket: bucketName,
        size: file.size,
        contentType: file.type,
        storageAccount: 1,
        isPrivate: true,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('=== iDrive E2 Upload Error ===');
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', msg);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: msg,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});