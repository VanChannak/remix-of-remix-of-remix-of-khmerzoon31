import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Bell, 
  Send, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  XCircle,
  Users,
  Eye,
  Trash2
} from "lucide-react";
import { useState } from "react";
import { NotificationDialog } from "@/components/admin/NotificationDialog";
import { format } from "date-fns";

type NotificationType = "info" | "success" | "warning" | "error";
type NotificationStatus = "sent" | "scheduled" | "draft";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  recipient: string;
  recipientCount: number;
  sentAt: string;
  scheduledFor?: string;
  readCount: number;
}

const Notifications = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Mock data
  const notifications: Notification[] = [
    {
      id: "1",
      title: "New Season Release",
      message: "Attack on Titan Final Season is now available!",
      type: "success",
      status: "sent",
      recipient: "All Users",
      recipientCount: 1250,
      sentAt: "2024-01-15T10:30:00",
      readCount: 892
    },
    {
      id: "2",
      title: "Maintenance Scheduled",
      message: "Platform will be under maintenance on Jan 20th from 2AM-4AM EST",
      type: "warning",
      status: "scheduled",
      recipient: "All Users",
      recipientCount: 1250,
      sentAt: "2024-01-18T14:20:00",
      scheduledFor: "2024-01-19T20:00:00",
      readCount: 0
    },
    {
      id: "3",
      title: "Welcome Aboard!",
      message: "Thanks for joining! Explore our vast library of anime content.",
      type: "info",
      status: "sent",
      recipient: "New Users",
      recipientCount: 48,
      sentAt: "2024-01-16T08:15:00",
      readCount: 35
    },
    {
      id: "4",
      title: "Subscription Expired",
      message: "Your premium subscription has expired. Renew now to continue enjoying premium content.",
      type: "error",
      status: "sent",
      recipient: "Premium Users",
      recipientCount: 12,
      sentAt: "2024-01-17T09:00:00",
      readCount: 10
    },
    {
      id: "5",
      title: "New Features Available",
      message: "Check out our new watchlist and recommendation features!",
      type: "info",
      status: "draft",
      recipient: "All Users",
      recipientCount: 1250,
      sentAt: "2024-01-18T11:45:00",
      readCount: 0
    },
  ];

  const stats = {
    total: notifications.length,
    sent: notifications.filter(n => n.status === "sent").length,
    scheduled: notifications.filter(n => n.status === "scheduled").length,
    drafts: notifications.filter(n => n.status === "draft").length,
    totalReach: notifications.reduce((sum, n) => sum + n.recipientCount, 0),
  };

  const filteredNotifications = notifications.filter((notif) => {
    const matchesSearch = 
      notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || notif.status === statusFilter;
    const matchesType = typeFilter === "all" || notif.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      case "warning":
        return <AlertCircle className="h-4 w-4" />;
      case "error":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case "success":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "warning":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "error":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  const getStatusColor = (status: NotificationStatus) => {
    switch (status) {
      case "sent":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "scheduled":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              Send and manage user notifications across the platform
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Send className="h-4 w-4 mr-2" />
            Send Notification
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                Total Sent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Sent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.sent}</div>
              <p className="text-xs text-muted-foreground mt-1">Delivered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                Scheduled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.scheduled}</div>
              <p className="text-xs text-muted-foreground mt-1">Pending</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                Drafts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.drafts}</div>
              <p className="text-xs text-muted-foreground mt-1">Not sent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Total Reach
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReach}</div>
              <p className="text-xs text-muted-foreground mt-1">Users reached</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent/Scheduled</TableHead>
                  <TableHead>Read Rate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No notifications found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNotifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell className="font-medium max-w-xs">
                        <div className="space-y-1">
                          <div className="font-semibold">{notification.title}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {notification.message}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getTypeColor(notification.type)}>
                          {getTypeIcon(notification.type)}
                          <span className="ml-1 capitalize">{notification.type}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{notification.recipient}</div>
                          <div className="text-xs text-muted-foreground">
                            {notification.recipientCount} users
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(notification.status)}>
                          {notification.status === "sent" && <CheckCircle className="h-3 w-3 mr-1" />}
                          {notification.status === "scheduled" && <AlertCircle className="h-3 w-3 mr-1" />}
                          <span className="capitalize">{notification.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {notification.status === "scheduled" && notification.scheduledFor ? (
                            <div>
                              <div className="font-medium">
                                {format(new Date(notification.scheduledFor), "MMM dd, yyyy")}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(notification.scheduledFor), "hh:mm a")}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium">
                                {format(new Date(notification.sentAt), "MMM dd, yyyy")}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(notification.sentAt), "hh:mm a")}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {notification.status === "sent" && (
                          <div className="space-y-1">
                            <div className="font-medium">
                              {((notification.readCount / notification.recipientCount) * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {notification.readCount}/{notification.recipientCount}
                            </div>
                          </div>
                        )}
                        {notification.status !== "sent" && (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <NotificationDialog 
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      </div>
    </AdminLayout>
  );
};

export default Notifications;
