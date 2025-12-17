import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, Flag, Eye, CheckCircle, XCircle } from "lucide-react";

const Reports = () => {
  // Mock data
  const reports = [
    { id: "1", type: "content", reporter: "user1@example.com", target: "Inappropriate comment on Inception", status: "pending", date: "2024-01-15", priority: "high" },
    { id: "2", type: "user", reporter: "user2@example.com", target: "Spam behavior from user3@example.com", status: "reviewing", date: "2024-01-16", priority: "medium" },
    { id: "3", type: "content", reporter: "user4@example.com", target: "Copyright issue with upload", status: "resolved", date: "2024-01-14", priority: "high" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">Review and manage user reports</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {reports.filter(r => r.status === "pending").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                {reports.filter(r => r.status === "reviewing").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {reports.filter(r => r.status === "resolved").length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Badge variant="outline">
                        <Flag className="h-3 w-3 mr-1" />
                        {report.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{report.reporter}</TableCell>
                    <TableCell className="max-w-xs truncate">{report.target}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={
                          report.priority === "high" 
                            ? "bg-red-500/10 text-red-500" 
                            : "bg-yellow-500/10 text-yellow-500"
                        }
                      >
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {report.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={
                          report.status === "resolved" 
                            ? "bg-green-500/10 text-green-500" 
                            : report.status === "reviewing"
                            ? "bg-yellow-500/10 text-yellow-500"
                            : "bg-red-500/10 text-red-500"
                        }
                      >
                        {report.status === "resolved" ? <CheckCircle className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{report.date}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                        {report.status !== "resolved" && (
                          <Button variant="ghost" size="sm" className="text-green-500">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Reports;
