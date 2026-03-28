import { useGetAnalyticsSummary, useGetVideos, useAnalyzeBatch, getGetVideosQueryKey, getGetAnalyticsSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PlayCircle, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetAnalyticsSummary();
  const { data: videosData, isLoading: videosLoading } = useGetVideos({ limit: 5 });
  const { mutate: analyzeBatch, isPending: isBatching } = useAnalyzeBatch();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleBatchAnalyze = () => {
    analyzeBatch(undefined, {
      onSuccess: (res) => {
        toast({
          title: "Batch Analysis Started",
          description: `Processed ${res.processed} videos. Succeeded: ${res.succeeded}, Failed: ${res.failed}.`,
        });
        queryClient.invalidateQueries({ queryKey: getGetVideosQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAnalyticsSummaryQueryKey() });
      },
      onError: (err) => {
        toast({
          title: "Batch Analysis Failed",
          description: "An error occurred while processing pending videos.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-display text-white mb-2">Welcome back</h1>
          <p className="text-muted-foreground">Here's what's happening with your video content.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/videos/new">Add Video</Link>
          </Button>
          <Button onClick={handleBatchAnalyze} disabled={isBatching || summary?.pendingVideos === 0}>
            <Sparkles className="w-4 h-4 mr-2" />
            {isBatching ? "Analyzing..." : `Analyze Pending (${summary?.pendingVideos || 0})`}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-primary/20 rounded-2xl text-primary">
              <PlayCircle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Videos</p>
              {summaryLoading ? <Skeleton className="h-8 w-16" /> : (
                <h3 className="text-3xl font-display font-bold text-white">{summary?.totalVideos || 0}</h3>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-emerald-500/20 rounded-2xl text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Analyzed</p>
              {summaryLoading ? <Skeleton className="h-8 w-16" /> : (
                <h3 className="text-3xl font-display font-bold text-white">{summary?.analyzedVideos || 0}</h3>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-amber-500/20 rounded-2xl text-amber-400">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Pending Analysis</p>
              {summaryLoading ? <Skeleton className="h-8 w-16" /> : (
                <h3 className="text-3xl font-display font-bold text-white">{summary?.pendingVideos || 0}</h3>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Videos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display text-white">Recent Videos</h2>
            <Link href="/videos" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-secondary/50 uppercase border-b border-border/50">
                  <tr>
                    <th className="px-6 py-4 font-medium">Title</th>
                    <th className="px-6 py-4 font-medium">Duration</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {videosLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="px-6 py-4"><Skeleton className="h-5 w-48" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                      </tr>
                    ))
                  ) : videosData?.videos?.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                        No videos found. Start by adding one!
                      </td>
                    </tr>
                  ) : (
                    videosData?.videos?.slice(0, 5).map(video => (
                      <tr key={video.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-white max-w-[200px] truncate">
                          <Link href={`/videos/${video.id}`} className="hover:text-primary transition-colors">
                            {video.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{formatDuration(video.duration)}</td>
                        <td className="px-6 py-4">
                          <Badge variant={
                            video.analysisStatus === 'completed' ? 'success' :
                            video.analysisStatus === 'pending' ? 'warning' :
                            video.analysisStatus === 'failed' ? 'destructive' : 'default'
                          }>
                            {video.analysisStatus}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Top Tags */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold font-display text-white">Top Tags</h2>
          <Card>
            <CardContent className="p-6">
              {summaryLoading ? (
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-8 w-20 rounded-full" />
                  <Skeleton className="h-8 w-24 rounded-full" />
                  <Skeleton className="h-8 w-16 rounded-full" />
                </div>
              ) : summary?.topTags && summary.topTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {summary.topTags.map(tag => (
                    <div key={tag.tag} className="flex items-center bg-secondary/50 rounded-full pl-3 pr-1 py-1 border border-border/50">
                      <span className="text-sm font-medium text-zinc-300 mr-2">{tag.tag}</span>
                      <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                        {tag.count}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No tags generated yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </Layout>
  );
}
