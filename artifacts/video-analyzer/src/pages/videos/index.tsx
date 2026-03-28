import { useState } from "react";
import { Link } from "wouter";
import { useGetVideos, useDeleteVideo, getGetVideosQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, PlusCircle, Trash2, Eye } from "lucide-react";

export default function VideosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data, isLoading } = useGetVideos();
  const { mutate: deleteVideo } = useDeleteVideo();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const filteredVideos = data?.videos?.filter(v => 
    v.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (v.genre && v.genre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this video?")) {
      deleteVideo({ id }, {
        onSuccess: () => {
          toast({ title: "Video deleted successfully" });
          queryClient.invalidateQueries({ queryKey: getGetVideosQueryKey() });
        },
        onError: () => {
          toast({ title: "Failed to delete video", variant: "destructive" });
        }
      });
    }
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-display text-white mb-2">Video Library</h1>
          <p className="text-muted-foreground">Manage and analyze your video metadata.</p>
        </div>
        <Button asChild>
          <Link href="/videos/new">
            <PlusCircle className="w-4 h-4 mr-2" />
            Add New Video
          </Link>
        </Button>
      </div>

      <Card className="mb-6 bg-card/30">
        <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search videos by title or genre..." 
              className="pl-10 bg-background"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-secondary/30 uppercase border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-medium">Video Details</th>
                <th className="px-6 py-4 font-medium">Genre & Tags</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-16 inline-block" /></td>
                  </tr>
                ))
              ) : filteredVideos?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    No videos found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredVideos?.map(video => (
                  <tr key={video.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white mb-1">{video.title}</div>
                      <div className="text-xs text-muted-foreground">{video.channel || 'Unknown Channel'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {video.genre ? (
                        <Badge variant="info" className="mb-2 mr-2">{video.genre}</Badge>
                      ) : (
                        <span className="text-muted-foreground italic text-xs block mb-2">Uncategorized</span>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {video.tags?.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] bg-secondary px-2 py-0.5 rounded text-zinc-300">
                            {tag}
                          </span>
                        ))}
                        {(video.tags?.length || 0) > 3 && (
                          <span className="text-[10px] bg-secondary/50 px-2 py-0.5 rounded text-muted-foreground">
                            +{(video.tags?.length || 0) - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        video.analysisStatus === 'completed' ? 'success' :
                        video.analysisStatus === 'pending' ? 'warning' :
                        video.analysisStatus === 'failed' ? 'destructive' : 'default'
                      }>
                        {video.analysisStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/videos/${video.id}`}>
                            <Eye className="w-4 h-4 text-zinc-400" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(video.id)} className="hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Layout>
  );
}
