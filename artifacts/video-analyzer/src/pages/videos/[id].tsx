import { useParams, Link } from "wouter";
import { useGetVideo, useAnalyzeVideo, getGetVideoQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, Youtube, Calendar, Clock, Loader2 } from "lucide-react";
import { formatDuration } from "@/lib/utils";

export default function VideoDetailPage() {
  const { id } = useParams();
  const videoId = parseInt(id || "0", 10);
  const { data: video, isLoading } = useGetVideo(videoId);
  const { mutate: analyze, isPending: isAnalyzing } = useAnalyzeVideo();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAnalyze = () => {
    analyze({ id: videoId }, {
      onSuccess: () => {
        toast({ title: "Analysis complete!", description: "AI insights have been generated." });
        queryClient.invalidateQueries({ queryKey: getGetVideoQueryKey(videoId) });
      },
      onError: () => {
        toast({ title: "Analysis failed", variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (!video) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-white mb-4">Video not found</h2>
          <Button asChild><Link href="/videos">Back to Videos</Link></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/videos"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <Badge variant={
              video.analysisStatus === 'completed' ? 'success' :
              video.analysisStatus === 'pending' ? 'warning' :
              video.analysisStatus === 'failed' ? 'destructive' : 'default'
            }>
              {video.analysisStatus.toUpperCase()}
            </Badge>
            {video.sentiment && <Badge variant="outline">{video.sentiment} sentiment</Badge>}
          </div>
          <h1 className="text-3xl font-bold font-display text-white">{video.title}</h1>
        </div>
        <Button onClick={handleAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          {video.analysisStatus === 'completed' ? 'Re-Analyze' : 'Analyze Now'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Metadata */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Youtube className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{video.channel || "Unknown Channel"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{formatDuration(video.duration)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : "Unknown Date"}</span>
              </div>
              {video.sourceUrl && (
                <a href={video.sourceUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline block mt-4">
                  View Source Video →
                </a>
              )}
            </CardContent>
          </Card>

          {video.analysisStatus === 'completed' && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg text-primary flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Target Audience</span>
                  <p className="text-sm text-white mt-1">{video.targetAudience || "Not identified"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Content Rating</span>
                  <p className="text-sm text-white mt-1">{video.contentRating || "General"}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Col: Content & Analysis */}
        <div className="lg:col-span-2 space-y-6">
          
          {video.analysisStatus === 'pending' && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
                <div>
                  <h3 className="font-semibold text-amber-500 mb-1">Analysis Pending</h3>
                  <p className="text-sm text-amber-500/80">Extract tags, topics, and summary automatically using Gemini AI.</p>
                </div>
                <Button onClick={handleAnalyze} disabled={isAnalyzing} className="bg-amber-600 hover:bg-amber-700 text-white">
                  Run Analysis
                </Button>
              </CardContent>
            </Card>
          )}

          {video.aiSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-300 leading-relaxed text-sm whitespace-pre-wrap">{video.aiSummary}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Topics</CardTitle>
              </CardHeader>
              <CardContent>
                {video.topics && video.topics.length > 0 ? (
                  <ul className="space-y-2">
                    {video.topics.map((topic, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {topic}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No topics extracted.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tags & Genre</CardTitle>
              </CardHeader>
              <CardContent>
                {video.genre && (
                  <div className="mb-4">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">Genre / Sub-genre</span>
                    <Badge variant="info" className="mr-2">{video.genre}</Badge>
                    {video.subGenre && <Badge variant="outline">{video.subGenre}</Badge>}
                  </div>
                )}
                
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">Generated Tags</span>
                  {video.tags && video.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {video.tags.map((tag, i) => (
                        <span key={i} className="text-xs bg-secondary/50 border border-border/50 px-2.5 py-1 rounded-md text-zinc-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No tags generated.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Original Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-secondary/20 rounded-xl text-sm text-muted-foreground whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                {video.description}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </Layout>
  );
}
