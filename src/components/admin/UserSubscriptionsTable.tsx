import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "./TableSkeleton";
import { format } from "date-fns";

export function UserSubscriptionsTable() {
  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ["user_subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select(`
          *,
          subscription_plans (name, price),
          profiles (email)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions?.map((subscription) => (
            <TableRow key={subscription.id}>
              <TableCell className="font-medium">
                {(subscription.profiles as any)?.email || "Unknown"}
              </TableCell>
              <TableCell>
                {(subscription.subscription_plans as any)?.name || "—"}
              </TableCell>
              <TableCell>
                {format(new Date(subscription.start_date), "MMM dd, yyyy")}
              </TableCell>
              <TableCell>
                {format(new Date(subscription.end_date), "MMM dd, yyyy")}
              </TableCell>
              <TableCell className="capitalize">{subscription.payment_status}</TableCell>
              <TableCell>
                <Badge variant={subscription.is_active ? "default" : "secondary"}>
                  {subscription.is_active ? "Active" : "Expired"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
