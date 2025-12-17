import { useState } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, Tablet, Laptop, X, Loader2 } from 'lucide-react';

interface DeviceSession {
  id: string;
  device_id: string;
  device_name: string;
  device_type: string;
  last_active_at: string;
  created_at: string;
}

interface DeviceLimitWarningProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maxDevices: number;
  activeSessions: DeviceSession[];
  currentDeviceId: string;
  onSignOutDevice: (deviceId: string) => Promise<void>;
  onSignOutAllDevices: () => Promise<void>;
}

export const DeviceLimitWarning = ({
  open,
  onOpenChange,
  maxDevices,
  activeSessions,
  currentDeviceId,
  onSignOutDevice,
  onSignOutAllDevices,
}: DeviceLimitWarningProps) => {
  const [signingOut, setSigningOut] = useState<string | null>(null);
  const [signingOutAll, setSigningOutAll] = useState(false);

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />;
      case 'tablet':
        return <Tablet className="h-5 w-5" />;
      case 'desktop':
        return <Monitor className="h-5 w-5" />;
      default:
        return <Laptop className="h-5 w-5" />;
    }
  };

  const formatLastActive = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const handleSignOutDevice = async (deviceId: string) => {
    setSigningOut(deviceId);
    try {
      await onSignOutDevice(deviceId);
    } finally {
      setSigningOut(null);
    }
  };

  const handleSignOutAll = async () => {
    setSigningOutAll(true);
    try {
      await onSignOutAllDevices();
    } finally {
      setSigningOutAll(false);
    }
  };

  const otherSessions = activeSessions.filter(s => s.device_id !== currentDeviceId);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md z-[100] bg-background border border-border shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Monitor className="h-5 w-5" />
            Device Limit Reached
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            You've reached the maximum of {maxDevices} streaming device{maxDevices > 1 ? 's' : ''} allowed. 
            Sign out from another device to continue watching on this one.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 my-4">
          <p className="text-sm font-medium text-foreground">Active Devices:</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {activeSessions.map((session) => (
              <div 
                key={session.id} 
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  session.device_id === currentDeviceId 
                    ? 'bg-primary/5 border-primary/20' 
                    : 'bg-muted/50 border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">
                    {getDeviceIcon(session.device_type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {session.device_name}
                      {session.device_id === currentDeviceId && (
                        <span className="ml-2 text-xs text-primary">(This device)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last active: {formatLastActive(session.last_active_at)}
                    </p>
                  </div>
                </div>
                {session.device_id !== currentDeviceId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleSignOutDevice(session.device_id)}
                    disabled={signingOut === session.device_id || signingOutAll}
                  >
                    {signingOut === session.device_id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          {otherSessions.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleSignOutAll}
              disabled={signingOutAll || signingOut !== null}
              className="w-full sm:w-auto"
            >
              {signingOutAll ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing out...
                </>
              ) : (
                `Sign out all other devices (${otherSessions.length})`
              )}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
