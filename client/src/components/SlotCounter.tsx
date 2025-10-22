import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users } from "lucide-react";

interface SlotCounterProps {
  registered: number;
  total: number;
  gameType: "bgmi" | "freefire";
}

export function SlotCounter({ registered, total, gameType }: SlotCounterProps) {
  const [animatedCount, setAnimatedCount] = useState(registered);
  const available = total - registered;
  const percentage = (registered / total) * 100;
  
  // Determine color based on availability
  const getStatusColor = () => {
    if (percentage >= 80) return "text-destructive";
    if (percentage >= 50) return "text-warning";
    return "text-success";
  };

  const getProgressColor = () => {
    if (percentage >= 80) return "bg-destructive";
    if (percentage >= 50) return "bg-warning";
    return "bg-success";
  };

  useEffect(() => {
    setAnimatedCount(registered);
  }, [registered]);

  const gameColor = gameType === "bgmi" ? "text-bgmi" : "text-freefire";

  return (
    <Card className="border-l-4" style={{ borderLeftColor: gameType === "bgmi" ? "hsl(25 95% 58%)" : "hsl(0 85% 60%)" }}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Tournament Slots</div>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${getStatusColor()}`}>{animatedCount}</span>
              <span className="text-2xl text-muted-foreground">/ {total}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className={`w-5 h-5 ${gameColor}`} />
            {available > 0 ? (
              <Badge className="bg-success/10 text-success hover:bg-success/20 border-success/20">
                {available} Available
              </Badge>
            ) : (
              <Badge variant="destructive">Full</Badge>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={percentage} className="h-2" indicatorClassName={getProgressColor()} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{percentage.toFixed(0)}% filled</span>
            <span>{available > 0 ? `${available} slots left` : "Tournament full"}</span>
          </div>
        </div>

        {available <= 5 && available > 0 && (
          <div className="mt-4 p-3 rounded-md bg-warning/10 border border-warning/20">
            <p className="text-xs font-medium text-warning">Only {available} slots remaining! Register quickly.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
