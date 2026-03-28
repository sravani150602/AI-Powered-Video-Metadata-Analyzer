import { useGetAnalyticsSummary, useGetContentTrends } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function AnalyticsPage() {
  const { data: summary, isLoading: summaryLoading } = useGetAnalyticsSummary();
  const { data: trendsData, isLoading: trendsLoading } = useGetContentTrends();

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-display text-white mb-2">Analytics</h1>
        <p className="text-muted-foreground">Deep dive into your video content trends and AI insights.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Trends Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Content Trends Over Time</CardTitle>
            <CardDescription>Number of videos published across different dates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              {trendsLoading ? (
                <Skeleton className="w-full h-full rounded-xl" />
              ) : trendsData?.trends && trendsData.trends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendsData.trends} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#a1a1aa" 
                      fontSize={12} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#a1a1aa" 
                      fontSize={12} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#8b5cf6" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#18181b', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#06b6d4', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  Not enough data to show trends.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Genre Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Genre Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {summaryLoading ? (
                <Skeleton className="w-full h-full rounded-xl" />
              ) : summary?.genreDistribution && summary.genreDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.genreDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="genre"
                    >
                      {summary.genreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No genre data available.
                </div>
              )}
            </div>
            {/* Custom Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {summary?.genreDistribution.map((entry, index) => (
                <div key={entry.genre} className="flex items-center gap-2 text-sm text-zinc-300">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  {entry.genre} ({entry.count})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Tags Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top AI-Generated Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {summaryLoading ? (
                <Skeleton className="w-full h-full rounded-xl" />
              ) : summary?.topTags && summary.topTags.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.topTags} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis 
                      type="category" 
                      dataKey="tag" 
                      stroke="#a1a1aa" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff', cursor: 'default' }}
                      itemStyle={{ color: '#06b6d4' }}
                    />
                    <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No tags generated yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}
