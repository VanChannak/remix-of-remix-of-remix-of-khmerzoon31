import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfileImage } from "@/hooks/useProfileImage";

interface CommentAvatarProps {
  profile?: {
    email: string;
    display_name?: string;
    profile_picture_url?: string;
  };
  userId?: string;
  size?: "sm" | "md";
}

export const CommentAvatar = ({ profile, userId, size = "md" }: CommentAvatarProps) => {
  const { signedUrl } = useProfileImage({ 
    imagePath: profile?.profile_picture_url,
    userId 
  });

  const displayName = profile?.display_name || profile?.email || 'Unknown';
  const initial = displayName.charAt(0).toUpperCase();
  const sizeClass = size === "sm" ? "h-8 w-8" : "h-10 w-10";

  return (
    <Avatar className={sizeClass}>
      <AvatarImage src={signedUrl || undefined} alt={displayName} />
      <AvatarFallback className={size === "sm" ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"}>
        {initial}
      </AvatarFallback>
    </Avatar>
  );
};