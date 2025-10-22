import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, InfoIcon } from "lucide-react";
import { type GameType } from "@shared/schema";

interface TournamentFullAlertProps {
  gameType: GameType;
}

export function TournamentFullAlert({ gameType }: TournamentFullAlertProps) {
  const gameColor = gameType === "bgmi" ? "text-bgmi" : "text-freefire";
  const gameBorder = gameType === "bgmi" ? "border-bgmi/30" : "border-freefire/30";
  const gameBg = gameType === "bgmi" ? "bg-bgmi/10" : "bg-freefire/10";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      data-testid="alert-tournament-full"
    >
      <Alert className={`${gameBorder} ${gameBg} border-2`}>
        <AlertTriangle className={`h-5 w-5 ${gameColor}`} />
        <AlertTitle className="text-lg font-bold">Tournament Full!</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p className="text-base">
            This tournament has reached maximum capacity. All slots are now filled.
          </p>
          <div className={`flex items-start gap-2 p-3 rounded-md bg-background/50 border ${gameBorder}`}>
            <InfoIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${gameColor}`} />
            <div className="space-y-1">
              <p className="text-sm font-medium">What's Next?</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Check other tournament modes that may still have available slots</li>
                <li>Follow us for announcements about upcoming tournaments</li>
                <li>Registered players will receive match details via WhatsApp</li>
              </ul>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}
