import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { S3Client } from "https://deno.land/x/s3_lite_client@0.7.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Storage configurations
const storageConfigs = [
  {
    accessKey: Deno.env.get('IDRIVEE2_ACCESS_KEY_1')!,
    secretKey: Deno.env.get('IDRIVEE2_SECRET_KEY_1')!,
  },
  {
    accessKey: Deno.env.get('IDRIVEE2_ACCESS_KEY_2')!,
    secretKey: Deno.env.get('IDRIVEE2_SECRET_KEY_2')!,
  },
  {
    accessKey: Deno.env.get('IDRIVEE2_ACCESS_KEY_3')!,
    secretKey: Deno.env.get('IDRIVEE2_SECRET_KEY_3')!,
  },
];

const ENDPOINT = 's3.ap-southeast-1.idrivee2.com';
const REGION = 'ap-southeast-1';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { filePath, expiryHours = 24 } = await req.json();

    if (!filePath) {
      throw new Error('File path is required');
    }

    // Get file metadata from database
    const { data: fileData, error: fileError } = await supabase
      .from('media_files')
      .select('*')
      .eq('file_path', filePath)
      .eq('user_id', user.id)
      .single();

    if (fileError || !fileData) {
      throw new Error('File not found or access denied');
    }

    const storage = storageConfigs[fileData.storage_account - 1];

    if (!storage.accessKey || !storage.secretKey) {
      throw new Error(`Storage account ${fileData.storage_account} not configured`);
    }

    console.log(`Generating signed URL for: ${filePath}`);
    console.log(`Storage account: ${fileData.storage_account}`);
    console.log(`Expiry: ${expiryHours} hours`);

    // Create S3 client
    const s3Client = new S3Client({
      endPoint: ENDPOINT,
      region: REGION,
      accessKey: storage.accessKey,
      secretKey: storage.secretKey,
      useSSL: true,
      pathStyle: false,
      bucket: fileData.bucket_name,
    });

    // Generate signed URL
    const expirySeconds = expiryHours * 60 * 60;
    const signedUrl = await s3Client.getPresignedUrl('GET', filePath, {
      expirySeconds,
    });

    console.log(`✓ Signed URL generated successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        url: signedUrl,
        expiresIn: `${expiryHours} hours`,
        path: filePath,
        bucket: fileData.bucket_name,
        storageAccount: fileData.storage_account,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error generating signed URL:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
