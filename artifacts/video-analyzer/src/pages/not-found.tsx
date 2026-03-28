import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-destructive/10 text-destructive flex items-center justify-center rounded-full mb-6">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold font-display text-white mb-4">404 - Page Not Found</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          The page you are looking for doesn't exist or has been moved. Check the URL or return to the dashboard.
        </p>
        <Button asChild size="lg">
          <Link href="/">Back to Dashboard</Link>
        </Button>
      </div>
    </Layout>
  );
}
