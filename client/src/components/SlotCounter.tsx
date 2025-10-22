import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, AlertCircle, TrendingUp } from "lucide-react";

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

  const getCircleColor = () => {
    if (percentage >= 80) return "stroke-destructive";
    if (percentage >= 50) return "stroke-warning";
    return "stroke-success";
  };

  useEffect(() => {
    // Animate count change
    let start = animatedCount;
    const end = registered;
    const duration = 500;
    const steps = 30;
    const stepValue = (end - start) / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setAnimatedCount(end);
        clearInterval(timer);
      } else {
        setAnimatedCount(Math.round(start + stepValue * currentStep));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [registered]);

  const gameColor = gameType === "bgmi" ? "text-bgmi" : "text-freefire";
  const gameBg = gameType === "bgmi" ? "bg-bgmi/10" : "bg-freefire/10";
  const gameBorder = gameType === "bgmi" ? "border-bgmi/30" : "border-freefire/30";

  // Circular progress calculations
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      data-testid="slot-counter"
    >
      <Card className={`border-l-4 ${gameBorder} ${gameBg}`}>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-[auto_1fr] gap-6 items-center">
            {/* Circular Progress Indicator */}
            <motion.div 
              className="relative w-32 h-32 mx-auto md:mx-0"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <svg className="w-32 h-32 transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted/30"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="64"
                  cy="64"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className={getCircleColor()}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span 
                  className={`text-3xl font-bold ${getStatusColor()}`}
                  key={animatedCount}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {animatedCount}
                </motion.span>
                <span className="text-xs text-muted-foreground">of {total}</span>
              </div>
            </motion.div>

            {/* Details Section */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className={`w-5 h-5 ${gameColor}`} />
                    <span className="text-sm font-medium text-muted-foreground">Tournament Slots</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl md:text-4xl font-bold ${getStatusColor()}`}>
                      {animatedCount}
                    </span>
                    <span className="text-xl md:text-2xl text-muted-foreground">/ {total}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className={`w-5 h-5 ${gameColor}`} />
                  {available > 0 ? (
                    <Badge className="bg-success/10 text-success hover:bg-success/20 border-success/20" data-testid="badge-slots-available">
                      {available} Available
                    </Badge>
                  ) : (
                    <Badge variant="destructive" data-testid="badge-slots-full">Full</Badge>
                  )}
                </div>
              </div>

              {/* Progress bar with percentage */}
              <div className="space-y-2">
                <Progress value={percentage} className="h-2" indicatorClassName={getProgressColor()} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{percentage.toFixed(0)}% filled</span>
                  <span>{available > 0 ? `${available} slots left` : "Tournament full"}</span>
                </div>
              </div>

              {/* Urgency messages with animations */}
              {available <= 10 && available > 0 && (
                <motion.div 
                  className={`p-3 rounded-md flex items-start gap-2 ${
                    available <= 5 
                      ? "bg-destructive/10 border border-destructive/20" 
                      : "bg-warning/10 border border-warning/20"
                  }`}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  data-testid="alert-low-slots"
                >
                  <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    available <= 5 ? "text-destructive" : "text-warning"
                  }`} />
                  <div>
                    <p className={`text-xs font-medium ${
                      available <= 5 ? "text-destructive" : "text-warning"
                    }`}>
                      {available <= 5 
                        ? `Only ${available} slots left! Register now before it's too late!`
                        : `Hurry up! Only ${available} slots remaining.`
                      }
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
