
import { placeholderSales, placeholderCustomers, placeholderProducts, recentActivities as placeholderRecentActivities } from "@/lib/placeholder-data";
import type { ActivityItem } from "@/lib/types"; // Ensure ActivityItem is imported from types
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, ShoppingCart, UserPlus } from "lucide-react"; // Assuming these are used as fallbacks or icons
import Image from "next/image";

export function RecentActivity() {
  // Using the imported recentActivities from placeholder-data
  const activitiesToDisplay: ActivityItem[] = placeholderRecentActivities;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">Recent Activity</CardTitle>
        <CardDescription>Overview of the latest actions in the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px]">
          <div className="space-y-6">
            {activitiesToDisplay.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4">
                <Avatar className="h-10 w-10 border">
                  {activity.type === 'new_product' && activity.avatarUrl &&
                    <Image
                        src={activity.avatarUrl}
                        alt={activity.title}
                        width={40}
                        height={40}
                        className="aspect-square object-cover rounded-full"
                        data-ai-hint={activity.aiHint || "product image"}
                    />
                  }
                  <AvatarFallback className="bg-muted">
                    {activity.avatarFallback ? activity.avatarFallback : (activity.icon ? <activity.icon className="h-5 w-5 text-muted-foreground" /> : <Package className="h-5 w-5 text-muted-foreground" />)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium leading-none">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
