import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  HardDrive,
  Search,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Image as ImageIcon,
  Film,
  Copy,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { useIDriveUpload } from '@/hooks/useIDriveUpload';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface StorageStats {
  name: string;
  status: 'active' | 'inactive';
  files: number;
  size: string;
}

interface UploadedFile {
  url: string;
  size: number;
  contentType: string;
  storageAccount: number;
  uploadedAt: Date;
  bucket: string;
  path: string;
}

export default function MediaManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedBucket, setSelectedBucket] = useState('media-files');
  const { uploadFile, uploadMultiple, uploading, progress, currentFile } = useIDriveUpload();

  // Mock storage stats - in production, you'd fetch this from an API
  const storageStats: StorageStats[] = [
    { name: 'Storage 1', status: 'active', files: 0, size: '0 GB' },
    { name: 'Storage 2', status: 'active', files: 0, size: '0 GB' },
    { name: 'Storage 3', status: 'active', files: 0, size: '0 GB' },
  ];

  const handleFileUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    
    if (fileArray.length === 1) {
      const result = await uploadFile(fileArray[0], { 
        bucket: selectedBucket, 
        path: 'uploads',
        category: 'general',
      });
      
      if (result.success && result.path) {
        setUploadedFiles(prev => [{
          url: result.path!,
          size: result.size || 0,
          contentType: result.contentType || '',
          storageAccount: result.storageAccount || 1,
          uploadedAt: new Date(),
          bucket: result.bucket || selectedBucket,
          path: result.path || '',
        }, ...prev]);
      }
    } else {
      const results = await uploadMultiple(fileArray, { 
        bucket: selectedBucket, 
        path: 'uploads',
        category: 'general',
      });
      
      const newFiles = results
        .filter(r => r.success && r.path)
        .map(r => ({
          url: r.path!,
          size: r.size || 0,
          contentType: r.contentType || '',
          storageAccount: r.storageAccount || 1,
          uploadedAt: new Date(),
          bucket: r.bucket || selectedBucket,
          path: r.path || '',
        }));
      
      setUploadedFiles(prev => [...newFiles, ...prev]);
    }
    
    setUploadDialogOpen(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('URL copied to clipboard');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (contentType.startsWith('video/')) return <Film className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const filteredFiles = uploadedFiles.filter(file => 
    file.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Media Manager</h1>
            <p className="text-muted-foreground">
              Manage files across 3 iDriveE2 storage accounts
            </p>
          </div>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Media
          </Button>
        </div>

        {/* Storage Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          {storageStats.map((storage, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{storage.name}</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{storage.files}</span>
                    <Badge variant={storage.status === 'active' ? 'default' : 'secondary'}>
                      {storage.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{storage.size} used</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upload Progress */}
        {uploading && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Uploading: {currentFile}</p>
                  <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Media Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search media files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

        {/* File List Placeholder */}
              <div className="rounded-lg border border-dashed p-12 text-center">
                <div className="mx-auto flex max-w-md flex-col items-center justify-center text-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No media files yet</h3>
                  <p className="text-sm text-muted-foreground mt-2 mb-4">
                    Upload your first media file to get started. All files are automatically
                    distributed across the 3 storage accounts for redundancy.
                  </p>
                  <Button onClick={() => setUploadDialogOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Media
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <HardDrive className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Multi-Storage Distribution
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Each upload is automatically stored on one of three iDriveE2 storage accounts
                  for load balancing and redundancy. This ensures high availability and performance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Dialog */}
        <AlertDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Upload Media Files</AlertDialogTitle>
              <AlertDialogDescription>
                Select files to upload. They will be automatically distributed across the storage accounts.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to select files or drag and drop
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileUpload(e.target.files);
                      setUploadDialogOpen(false);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
