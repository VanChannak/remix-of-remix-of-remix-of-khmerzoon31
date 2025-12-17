import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Monitor, Tablet, LogOut } from "lucide-react";
import { useDeviceSession } from "@/hooks/useDeviceSession";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const getDeviceIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'mobile':
      return <Smartphone className="w-5 h-5" />;
    case 'tablet':
      return <Tablet className="w-5 h-5" />;
    default:
      return <Monitor className="w-5 h-5" />;
  }
};

export const ActiveDevices = () => {
  const { sessions, currentDeviceId, maxDevices, signOutDevice, signOutAllDevices } = useDeviceSession();

  const otherSessions = sessions.filter(s => s.device_id !== currentDeviceId);
  const currentSession = sessions.find(s => s.device_id === currentDeviceId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Active Devices</CardTitle>
            <CardDescription>
              {sessions.length} of {maxDevices} devices active
            </CardDescription>
          </div>
          {otherSessions.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Sign Out All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign Out All Devices?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will sign you out from all other devices except this one.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={signOutAllDevices}>
                    Sign Out All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentSession && (
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="text-muted-foreground">
                {getDeviceIcon(currentSession.device_type)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{currentSession.device_name}</p>
                  <Badge variant="default" className="text-xs">This Device</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Active {formatDistanceToNow(new Date(currentSession.last_active_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        )}

        {otherSessions.length === 0 && !currentSession && (
          <p className="text-center text-muted-foreground py-4">
            No active devices
          </p>
        )}

        {otherSessions.map((session) => (
          <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="text-muted-foreground">
                {getDeviceIcon(session.device_type)}
              </div>
              <div>
                <p className="font-medium">{session.device_name}</p>
                <p className="text-sm text-muted-foreground">
                  Active {formatDistanceToNow(new Date(session.last_active_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <LogOut className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign Out Device?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will sign out {session.device_name} from your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => signOutDevice(session.device_id)}>
                    Sign Out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
