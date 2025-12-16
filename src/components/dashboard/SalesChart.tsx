
"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, type TooltipProps } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { SalesChartData } from "@/lib/types"
import { cn } from "@/lib/utils"

interface SalesChartProps {
  data: SalesChartData[];
  title: string;
  description: string;
  comparisonData?: number[];
}

const CustomTooltip = ({ active, payload, label, comparisonData }: TooltipProps<number, string> & { comparisonData?: number[] }) => {
  if (active && payload && payload.length) {
    // The chart data needs an 'index' property for this to work reliably
    const dataPoint = payload[0].payload;
    const dataIndex = 'index' in dataPoint ? dataPoint.index : -1;
    const comparisonValue = (comparisonData && dataIndex !== -1 && comparisonData[dataIndex] !== undefined) ? comparisonData[dataIndex] : null;
    
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              {label}
            </span>
            <span className="font-bold text-muted-foreground">
              Rs. {payload[0].value?.toLocaleString()}
            </span>
          </div>
          {comparisonValue !== null && comparisonValue !== 0 && (
             <div className="flex flex-col space-y-1">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                vs LY
              </span>
              <span className={cn("font-bold", comparisonValue > 0 ? "text-green-600" : "text-destructive")}>
                {comparisonValue > 0 ? "+" : ""}{comparisonValue.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};


export function SalesChart({ data, title, description, comparisonData }: SalesChartProps) {
  // Add index to data for tooltip to reliably get comparison data
  const chartData = data.map((d, index) => ({...d, index}));

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `Rs. ${value}`}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))", radius: "var(--radius)" }}
                content={<CustomTooltip comparisonData={comparisonData} />}
              />
              <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
