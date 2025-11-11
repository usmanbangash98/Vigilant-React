import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  BarChart3, 
  Users, 
  Clock, 
  TrendingUp
} from "lucide-react";
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { buildBackendUrl } from "@/lib/utils";

interface ReportsStatistics {
  overview: {
    total_detections: number;
    total_faces_detected: number;
    total_known_matches: number;
    total_unknown_faces: number;
    avg_processing_time: number;
    match_rate: number;
  };
  daily_stats: Array<{
    date: string;
    detections: number;
    total_faces: number;
    known_faces: number;
    unknown_faces: number;
    avg_processing_time: number;
  }>;
  top_matches: Array<{
    matched_person__name: string;
    matched_person__status: string;
    match_count: number;
    avg_confidence: number;
  }>;
  recent_detections: Array<{
    id: number;
    image_name: string;
    image_path: string;
    total_faces_detected: number;
    known_faces_matched: number;
    unknown_faces_detected: number;
    processing_time_seconds: number;
    created_at: string;
  }>;
}

export default function ReportsPage() {
  const [statistics, setStatistics] = useState<ReportsStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(30);

  const loadStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(
        buildBackendUrl(`/api/reports-statistics?days=${dateRange}`),
        {
          method: "GET",
          credentials: "include",
        }
      );
      
      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        const message = data?.error || data?.detail || "Unable to load statistics.";
        setError(message);
        return;
      }
      
      const data = await resp.json();
      setStatistics(data.statistics);
    } catch (error) {
      setError("Network error while loading statistics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [dateRange]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };


  const formatDateOnly = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTimeOnly = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">
            Detection Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            Real-time statistics and insights from face detection operations.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="px-3 py-2 border border-border rounded-md bg-background text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select> 
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading statistics...</div>
        </div>
      ) : statistics ? (
        <>
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Detections</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.overview.total_detections}</div>
                <p className="text-xs text-muted-foreground">
                  Detection sessions in last {dateRange} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faces Detected</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.overview.total_faces_detected}</div>
                <p className="text-xs text-muted-foreground">
                  {statistics.overview.total_known_matches} known, {statistics.overview.total_unknown_faces} unknown
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Match Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.overview.match_rate}%</div>
                <p className="text-xs text-muted-foreground">
                  Known faces identified
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.overview.avg_processing_time}s</div>
                <p className="text-xs text-muted-foreground">
                  Per detection session
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Detection Activity</CardTitle>
              <CardDescription>
                Face detection trends over the last {dateRange} days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={statistics.daily_stats.slice(-14).map(day => ({
                      ...day,
                      date: formatDate(day.date)
                    }))}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      yAxisId="left"
                      tick={{ fontSize: 12 }} 
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend />
                    
                    {/* Bars for face counts */}
                    <Bar 
                      dataKey="known_faces" 
                      name="Known Faces" 
                      fill="#22c55e" 
                      stackId="faces"
                      yAxisId="left"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar 
                      dataKey="unknown_faces" 
                      name="Unknown Faces" 
                      fill="#f97316" 
                      stackId="faces"
                      yAxisId="left"
                      radius={[4, 4, 0, 0]}
                    />
                    
                    {/* Line for processing time */}
                    <Line 
                      type="monotone" 
                      dataKey="avg_processing_time" 
                      name="Avg Processing Time (s)"
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                      yAxisId="right"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Most Detected Persons Table */}
          <Card>
            <CardHeader>
              <CardTitle>Most Detected Persons</CardTitle>
              <CardDescription>
                Frequently matched individuals ranked by detection count
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Rank
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Name
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Matches
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Avg Confidence
                        </th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {statistics.top_matches.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-muted-foreground">
                            No matches found in this period
                          </td>
                        </tr>
                      ) : (
                        statistics.top_matches.slice(0, 10).map((match, index) => (
                          <tr key={index} className="border-b transition-colors hover:bg-muted/50">
                            <td className="p-4 align-middle">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                {index + 1}
                              </div>
                            </td>
                            <td className="p-4 align-middle font-medium">
                              {match.matched_person__name}
                            </td>
                            <td className="p-4 align-middle">
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                match.matched_person__status === 'Wanted' 
                                  ? 'bg-destructive/10 text-destructive' 
                                  : match.matched_person__status === 'Free'
                                  ? 'bg-green-500/10 text-green-700'
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {match.matched_person__status}
                              </span>
                            </td>
                            <td className="p-4 align-middle">
                              <span className="font-medium">{match.match_count}</span>
                              <span className="text-muted-foreground text-xs ml-1">detections</span>
                            </td>
                            <td className="p-4 align-middle">
                              <span className="font-medium">{(match.avg_confidence * 100).toFixed(1)}%</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Detection Sessions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Detection Sessions</CardTitle>
              <CardDescription>
                Latest face detection activities with detailed information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Image
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Date
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Time
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Total Faces
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Known
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Unknown
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Processing Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {statistics.recent_detections.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted-foreground">
                            No recent detections
                          </td>
                        </tr>
                      ) : (
                        statistics.recent_detections.slice(0, 10).map((detection) => (
                          <tr key={detection.id} className="border-b transition-colors hover:bg-muted/50">
                            <td className="p-4 align-middle">
                              <div className="flex items-center gap-3">
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-border/50">
                                  <img
                                    src={buildBackendUrl(detection.image_path)}
                                    alt={detection.image_name}
                                    className="w-full h-full object-cover"
                                    onLoad={() => {
                                      console.log('✅ Image loaded successfully:', buildBackendUrl(detection.image_path));
                                    }}
                                    onError={(e) => {
                                      console.error('❌ Image failed to load:', buildBackendUrl(detection.image_path));
                                      // Fallback to eye icon if image fails to load
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent) {
                                        parent.innerHTML = `
                                          <div class="w-full h-full flex items-center justify-center bg-muted text-xs">
                                            <div class="text-center">
                                              <svg class="w-4 h-4 text-muted-foreground mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                              </svg>
                                              <div class="text-muted-foreground">No Image</div>
                                            </div>
                                          </div>
                                        `;
                                      }
                                    }}
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-sm truncate" title={detection.image_name}>
                                    {detection.image_name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    ID: {detection.id}
                                  </div>
                                  <div className="text-xs text-red-500 truncate" title={detection.image_path}>
                                    Path: {detection.image_path}
                                  </div>
                                  <div className="text-xs text-blue-500 truncate" title={buildBackendUrl(detection.image_path)}>
                                    URL: {buildBackendUrl(detection.image_path)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 align-middle">
                              <span className="text-sm font-medium">
                                {formatDateOnly(detection.created_at)}
                              </span>
                            </td>
                            <td className="p-4 align-middle">
                              <span className="text-sm font-medium text-blue-600">
                                {formatTimeOnly(detection.created_at)}
                              </span>
                            </td>
                            <td className="p-4 align-middle">
                              <span className="font-medium">{detection.total_faces_detected}</span>
                            </td>
                            <td className="p-4 align-middle">
                              <span className="font-medium text-green-600">
                                {detection.known_faces_matched}
                              </span>
                            </td>
                            <td className="p-4 align-middle">
                              <span className="font-medium text-orange-600">
                                {detection.unknown_faces_detected}
                              </span>
                            </td>
                            <td className="p-4 align-middle">
                              <span className="text-sm text-muted-foreground">
                                {detection.processing_time_seconds.toFixed(2)}s
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          No data available
        </div>
      )}
    </div>
  );
}
