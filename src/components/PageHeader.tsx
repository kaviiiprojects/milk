import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-7 w-7 text-primary" />}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-foreground">{title}</h1>
          {description && <div className="text-muted-foreground">{description}</div>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
