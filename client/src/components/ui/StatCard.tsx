import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={cn("glass-card rounded-2xl p-6 relative overflow-hidden group", className)}>
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-24 h-24" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Icon className="w-6 h-6" />
          </div>
          {trend && (
            <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
              {trend}
            </span>
          )}
        </div>
        
        <h3 className="text-muted-foreground text-sm font-medium mb-1">{title}</h3>
        <p className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
          {value}
        </p>
      </div>
    </div>
  );
}
