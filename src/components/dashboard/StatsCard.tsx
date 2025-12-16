
"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  className?: string;
  iconColor?: string;
  trend?: number; // e.g., 12.5 for +12.5%
  additionalInfo?: string;
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  className, 
  iconColor = "text-primary",
  trend,
  additionalInfo
}: StatsCardProps) {
  const TrendIcon = trend && trend > 0 ? ArrowUpRight : ArrowDownRight;
  const trendColor = trend && trend > 0 ? "text-green-600" : trend && trend < 0 ? "text-destructive" : "text-muted-foreground";

  return (
    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn("h-5 w-5", iconColor)} />
      </CardHeader>
      <CardContent className="flex-1">
        <div className="text-2xl font-bold font-headline text-foreground">
          {value}
        </div>
        {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
      </CardContent>
      {(trend !== undefined || additionalInfo) && (
        <CardFooter className="pt-0 pb-4 text-xs text-muted-foreground flex items-center justify-between">
           {trend !== undefined && trend !== 0 ? (
            <Badge variant="outline" className={cn("border-none text-xs font-medium", trendColor)}>
              <TrendIcon className="mr-1 h-3.5 w-3.5" />
              {Math.abs(trend).toFixed(1)}%
            </Badge>
          ) : (
            <span /> 
          )}
          {additionalInfo && <span>{additionalInfo}</span>}
        </CardFooter>
      )}
    </Card>
  );
}
