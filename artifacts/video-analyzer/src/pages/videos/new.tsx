import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateVideo, getGetVideosQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Mirroring the API schema for validation
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  channel: z.string().optional(),
  duration: z.coerce.number().optional(),
  publishedAt: z.string().optional(),
  sourceUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewVideoPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutate: createVideo, isPending } = useCreateVideo();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      channel: "",
      sourceUrl: "",
    }
  });

  const onSubmit = (data: FormValues) => {
    // Clean up empty strings to undefined to match API schema if needed
    const payload = {
      ...data,
      sourceUrl: data.sourceUrl || undefined,
      channel: data.channel || undefined,
      publishedAt: data.publishedAt || undefined,
    };

    createVideo({ data: payload }, {
      onSuccess: (res) => {
        toast({ title: "Video created successfully!" });
        queryClient.invalidateQueries({ queryKey: getGetVideosQueryKey() });
        setLocation(`/videos/${res.id}`);
      },
      onError: (err) => {
        toast({ 
          title: "Failed to create video", 
          description: err.error || "Please check your inputs.",
          variant: "destructive" 
        });
      }
    });
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-white mb-2">Ingest Metadata</h1>
          <p className="text-muted-foreground">Add a new video record to analyze its content via AI.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Video Details</CardTitle>
            <CardDescription>Enter the raw metadata from the source platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="space-y-2">
                <Label htmlFor="title">Video Title <span className="text-destructive">*</span></Label>
                <Input id="title" placeholder="e.g. 10 React Tips for Beginners" {...register("title")} />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
                <Textarea 
                  id="description" 
                  placeholder="Paste the full video description here..." 
                  className="min-h-[150px]"
                  {...register("description")} 
                />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="channel">Channel Name</Label>
                  <Input id="channel" placeholder="e.g. Code UI" {...register("channel")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (seconds)</Label>
                  <Input id="duration" type="number" placeholder="e.g. 360" {...register("duration")} />
                  {errors.duration && <p className="text-sm text-destructive">{errors.duration.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="publishedAt">Published Date</Label>
                  <Input id="publishedAt" type="date" {...register("publishedAt")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sourceUrl">Source URL</Label>
                  <Input id="sourceUrl" placeholder="https://youtube.com/..." {...register("sourceUrl")} />
                  {errors.sourceUrl && <p className="text-sm text-destructive">{errors.sourceUrl.message}</p>}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setLocation('/videos')} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save and Continue
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
