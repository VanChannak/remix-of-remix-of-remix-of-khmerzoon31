import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Reply, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { CommentAvatar } from "@/components/comments/CommentAvatar";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  parent_id: string | null;
  profiles?: {
    email: string;
    display_name?: string;
    profile_picture_url?: string;
  };
  replies?: Comment[];
}

interface CommentsSectionProps {
  episodeId?: string;
  movieId?: string;
}

export const CommentsSection = ({ episodeId, movieId }: CommentsSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchComments();
  }, [episodeId, movieId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (user) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!roleData);
    }
  };

  const fetchComments = async () => {
    const query = supabase
      .from("comments")
      .select("*")
      .is("is_deleted", false)
      .is("parent_id", null)
      .order("created_at", { ascending: false });

    if (episodeId) {
      query.eq("episode_id", episodeId);
    } else if (movieId) {
      query.eq("movie_id", movieId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching comments:", error);
      return;
    }

    // Fetch profiles and replies separately
    const commentsWithData = await Promise.all(
      (data || []).map(async (comment) => {
        // Fetch profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("email, display_name, profile_picture_url")
          .eq("id", comment.user_id)
          .maybeSingle();

        // Fetch replies
        const { data: repliesData } = await supabase
          .from("comments")
          .select("*")
          .eq("parent_id", comment.id)
          .is("is_deleted", false)
          .order("created_at", { ascending: true });

        // Fetch profiles for replies
        const repliesWithProfiles = await Promise.all(
          (repliesData || []).map(async (reply) => {
            const { data: replyProfile } = await supabase
              .from("profiles")
              .select("email, display_name, profile_picture_url")
              .eq("id", reply.user_id)
              .maybeSingle();

            return {
              ...reply,
              profiles: replyProfile || { email: "Unknown" },
            };
          })
        );

        return {
          ...comment,
          profiles: profileData || { email: "Unknown" },
          replies: repliesWithProfiles,
        };
      })
    );

    setComments(commentsWithData);
  };

  const handlePostComment = async () => {
    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }

    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("comments").insert({
      user_id: user.id,
      episode_id: episodeId || null,
      movie_id: movieId || null,
      content: newComment.trim(),
    });

    setLoading(false);

    if (error) {
      toast.error("Failed to post comment");
      console.error(error);
      return;
    }

    toast.success("Comment posted!");
    setNewComment("");
    fetchComments();
  };

  const handlePostReply = async (parentId: string) => {
    if (!user) {
      toast.error("Please sign in to reply");
      return;
    }

    if (!replyContent.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("comments").insert({
      user_id: user.id,
      episode_id: episodeId || null,
      movie_id: movieId || null,
      content: replyContent.trim(),
      parent_id: parentId,
    });

    setLoading(false);

    if (error) {
      toast.error("Failed to post reply");
      console.error(error);
      return;
    }

    toast.success("Reply posted!");
    setReplyContent("");
    setReplyTo(null);
    fetchComments();
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("comments")
      .update({ is_deleted: true })
      .eq("id", commentId);

    if (error) {
      toast.error("Failed to delete comment");
      console.error(error);
      return;
    }

    toast.success("Comment deleted");
    fetchComments();
  };

  const getDisplayName = (profile?: { email: string; display_name?: string }) => {
    return profile?.display_name || profile?.email || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Comments ({comments.length})</h3>
      </div>

      {/* New Comment */}
      {user ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex justify-end">
                <Button onClick={handlePostComment} disabled={loading}>
                  <Send className="h-4 w-4 mr-2" />
                  Post Comment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              Please sign in to comment
            </p>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment.id}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Comment Header */}
                <div className="flex items-start gap-3">
                  <CommentAvatar profile={comment.profiles} userId={comment.user_id} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{getDisplayName(comment.profiles)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          {comment.is_edited && " (edited)"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {user && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReplyTo(comment.id)}
                          >
                            <Reply className="h-4 w-4" />
                          </Button>
                        )}
                        {(user?.id === comment.user_id || isAdmin) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-sm">{comment.content}</p>
                  </div>
                </div>

                {/* Reply Form */}
                {replyTo === comment.id && (
                  <div className="ml-12 space-y-2">
                    <Textarea
                      placeholder="Write a reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReplyTo(null);
                          setReplyContent("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handlePostReply(comment.id)}
                        disabled={loading}
                      >
                        Post Reply
                      </Button>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-12 space-y-3 pt-3 border-t">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex items-start gap-3">
                        <CommentAvatar profile={reply.profiles} userId={reply.user_id} size="sm" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{getDisplayName(reply.profiles)}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                              </p>
                            </div>
                            {(user?.id === reply.user_id || isAdmin) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteComment(reply.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                          <p className="mt-1 text-sm">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
