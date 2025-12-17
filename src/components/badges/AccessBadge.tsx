import { Crown, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AccessBadgeProps {
  access: "free" | "rent" | "vip";
  className?: string;
}

export const AccessBadge = ({ access, className = "" }: AccessBadgeProps) => {
  if (access === "free") {
    return (
      <Badge variant="secondary" className={`bg-green-500/20 text-green-400 border-green-500/30 ${className}`}>
        Free
      </Badge>
    );
  }

  if (access === "rent") {
    return (
      <Badge variant="secondary" className={`bg-orange-500/20 text-orange-400 border-orange-500/30 ${className}`}>
        <DollarSign className="w-3 h-3 mr-1" />
        Rent
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={`bg-primary/20 text-primary border-primary/30 ${className}`}>
      <Crown className="w-3 h-3 mr-1" />
      VIP
    </Badge>
  );
};
