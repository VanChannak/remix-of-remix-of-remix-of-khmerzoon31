import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AdPreviewToggleProps {
  onPreviewChange: (isPreview: boolean) => void;
}

export function AdPreviewToggle({ onPreviewChange }: AdPreviewToggleProps) {
  const [isPreview, setIsPreview] = useState(false);

  const togglePreview = () => {
    const newValue = !isPreview;
    setIsPreview(newValue);
    onPreviewChange(newValue);
  };

  return (
    <Button
      variant={isPreview ? "default" : "outline"}
      onClick={togglePreview}
      className="gap-2"
    >
      {isPreview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      Preview Mode
      {isPreview && <Badge variant="secondary" className="ml-1">ON</Badge>}
    </Button>
  );
}
