import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Trophy, Users, Shield, AlertCircle, 
  Clock, Coins, UserCircle, Zap, 
  CheckCircle, BookOpen, CreditCard, Award,
  Swords, Target, Info
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SlotCounter } from "@/components/SlotCounter";
import { RegistrationForm } from "@/components/RegistrationForm";
import { type GameType, type TournamentType, type Tournament, TOURNAMENT_CONFIG } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import bgmiBanner from "@assets/generated_images/BGMI_tournament_hero_banner_b2150cce.png";
import freeFireBanner from "@assets/generated_images/Free_Fire_tournament_hero_banner_dddd7ca1.png";

interface TournamentPageProps {
  gameType: GameType;
}

// Countdown Timer Component
function CountdownTimer({ gameType }: { gameType: GameType }) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 12,
    minutes: 30,
    seconds: 45
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        }
        
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const gameColor = gameType === "bgmi" ? "text-bgmi" : "text-freefire";
  const gameBg = gameType === "bgmi" ? "bg-bgmi/10" : "bg-freefire/10";
  const gameBorder = gameType === "bgmi" ? "border-bgmi/30" : "border-freefire/30";

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${gameBg} ${gameBorder} border-2 rounded-md p-4 mb-8`}
      data-testid="countdown-timer"
    >
      <div className="flex flex-col md:flex-row items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <Clock className={`w-5 h-5 ${gameColor}`} />
          <span className="font-semibold">Tournament starts in:</span>
        </div>
        <div className="flex gap-2">
          {[
            { value: timeLeft.hours, label: 'Hours', testId: 'countdown-hours' },
            { value: timeLeft.minutes, label: 'Minutes', testId: 'countdown-minutes' },
            { value: timeLeft.seconds, label: 'Seconds', testId: 'countdown-seconds' }
          ].map((item, idx) => (
            <div key={idx}>
              <motion.div
                key={item.value}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`${gameBg} ${gameBorder} border rounded-md px-3 py-2 min-w-[60px] text-center`}
                data-testid={item.testId}
              >
                <div className={`text-2xl font-bold ${gameColor}`}>
                  {String(item.value).padStart(2, '0')}
                </div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </motion.div>
              {idx < 2 && <span className="text-2xl font-bold mx-1">:</span>}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function TournamentPage({ gameType }: TournamentPageProps) {
  const [activeTab, setActiveTab] = useState<TournamentType>("solo");
  const { toast } = useToast();

  // Fetch all tournaments
  const { data: tournaments, isLoading } = useQuery<Tournament[]>({
    queryKey: ["/api/tournaments"],
  });

  // Get current tournament data
  const getTournamentData = (type: TournamentType) => {
    return tournaments?.find(
      (t) => t.gameType === gameType && t.tournamentType === type
    ) || {
      registeredCount: 0,
      maxSlots: TOURNAMENT_CONFIG[gameType][type].maxSlots,
      qrCodeUrl: null,
    };
  };

  // Create registration mutation
  const createRegistrationMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/registrations", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      toast({
        title: "Registration Submitted!",
        description: "Your registration is pending approval. You'll be notified soon.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const config = TOURNAMENT_CONFIG[gameType][activeTab];
  const gameTitle = gameType === "bgmi" ? "BGMI" : "Free Fire";
  const gameColor = gameType === "bgmi" ? "text-bgmi" : "text-freefire";
  const gameBg = gameType === "bgmi" ? "bg-bgmi" : "bg-freefire";
  const gameBgLight = gameType === "bgmi" ? "bg-bgmi/10" : "bg-freefire/10";
  const gameBorder = gameType === "bgmi" ? "border-bgmi" : "border-freefire";
  const bannerImage = gameType === "bgmi" ? bgmiBanner : freeFireBanner;

  const handleSubmit = async (data: any) => {
    createRegistrationMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  const getTabIcon = (type: TournamentType) => {
    switch (type) {
      case "solo":
        return <Users className="w-4 h-4" />;
      case "duo":
        return <Users className="w-4 h-4" />;
      case "squad":
        return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      {/* Enhanced Hero Banner */}
      <div className="relative h-80 md:h-96 overflow-hidden mb-8">
        <motion.img 
          src={bannerImage} 
          alt={`${gameTitle} Tournament Banner`}
          className="w-full h-full object-cover"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8 }}
        />
        {/* Multiple gradient overlays for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
        
        {/* Animated particles effect */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-2 h-2 ${gameBg} rounded-full`}
              initial={{ 
                x: `${Math.random() * 100}%`, 
                y: `${Math.random() * 100}%`,
                opacity: 0.2
              }}
              animate={{ 
                y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
                opacity: [0.2, 0.5, 0.2]
              }}
              transition={{ 
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Hero content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center justify-center gap-4 mb-6"
            >
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              >
                <Trophy className={`w-12 h-12 md:w-16 md:h-16 ${gameColor}`} data-testid="icon-trophy-hero" />
              </motion.div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-white drop-shadow-2xl" data-testid="text-hero-title">
                {gameTitle}
              </h1>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className={`inline-block px-6 py-2 ${gameBgLight} ${gameBorder} border-2 rounded-full mb-6`}
            >
              <span className={`text-xl md:text-2xl font-bold ${gameColor}`}>
                TOURNAMENT 2025
              </span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-lg md:text-2xl text-white/95 drop-shadow-lg max-w-3xl mx-auto font-medium"
            >
              Choose your tournament mode and compete for amazing prizes
            </motion.p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Countdown Timer */}
        <CountdownTimer gameType={gameType} />

        {/* Tournament Modes Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TournamentType)} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1">
            <TabsTrigger value="solo" className="gap-2 py-3" data-testid="tab-solo">
              {getTabIcon("solo")}
              <span>Solo</span>
              <Badge variant="secondary" className="ml-auto">{getTournamentData("solo").registeredCount}/{getTournamentData("solo").maxSlots}</Badge>
            </TabsTrigger>
            <TabsTrigger value="duo" className="gap-2 py-3" data-testid="tab-duo">
              {getTabIcon("duo")}
              <span>Duo</span>
              <Badge variant="secondary" className="ml-auto">{getTournamentData("duo").registeredCount}/{getTournamentData("duo").maxSlots}</Badge>
            </TabsTrigger>
            <TabsTrigger value="squad" className="gap-2 py-3" data-testid="tab-squad">
              {getTabIcon("squad")}
              <span>Squad</span>
              <Badge variant="secondary" className="ml-auto">{getTournamentData("squad").registeredCount}/{getTournamentData("squad").maxSlots}</Badge>
            </TabsTrigger>
          </TabsList>

          {["solo", "duo", "squad"].map((mode) => {
            const tournamentData = getTournamentData(mode as TournamentType);
            return (
            <TabsContent key={mode} value={mode} className="space-y-8">
              {/* Slot Counter */}
              <SlotCounter
                registered={tournamentData.registeredCount}
                total={tournamentData.maxSlots}
                gameType={gameType}
              />

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Rules & Regulations */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card className={`${gameBorder} border-t-4`}>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-6">
                          <BookOpen className={`w-6 h-6 ${gameColor}`} />
                          <h2 className="text-2xl font-bold">Rules & Regulations</h2>
                        </div>
                        <Accordion type="single" collapsible className="w-full space-y-3">
                          <AccordionItem value="general" className="border rounded-md px-4 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" data-testid="accordion-general">
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <span className="font-semibold">General Rules</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground space-y-2 pt-4">
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                <p>All matches must be played on the latest official version of {gameTitle}</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                <p>Only mobile phones are allowed. Emulators, tablets are strictly prohibited</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                <p>Players must ensure stable internet connection before starting</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                <p>No use of hacks, mod APKs, or third-party software</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                <p>No teaming with players outside your registered team</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                <p>Respectful behavior is mandatory - no abuse or toxic behavior</p>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="registration" className={`border rounded-md px-4 ${gameBgLight} ${gameBorder}`} data-testid="accordion-registration">
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-2">
                                <CreditCard className={`w-5 h-5 ${gameColor}`} />
                                <span className="font-semibold">Registration & Payment</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground space-y-2 pt-4">
                              <div className="flex items-start gap-2">
                                <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${gameColor}`} />
                                <p>Entry fee: ₹{config.entryFee} per {mode === "solo" ? "player" : "team"}</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${gameColor}`} />
                                <p>Payment must be completed via UPI to the provided QR code</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${gameColor}`} />
                                <p>Upload clear payment screenshot with visible transaction ID</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${gameColor}`} />
                                <p>Registration will be confirmed after admin approval</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${gameColor}`} />
                                <p>Room ID and password will be shared 30 minutes before match</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${gameColor}`} />
                                <p>No refunds after registration approval</p>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="prizes" className="border rounded-md px-4 bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800" data-testid="accordion-prizes">
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <span className="font-semibold">Prize Structure</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground space-y-2 pt-4">
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" />
                                <p>Winner: ₹{config.winner}</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" />
                                <p>Runner Up: ₹{config.runnerUp}</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" />
                                <p>Per Kill: ₹{config.perKill}</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" />
                                <p>Prizes will be transferred within 24 hours of match completion</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" />
                                <p>Winners must provide valid UPI details for prize transfer</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" />
                                <p>Screenshot verification may be required for prize claims</p>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="conduct" className="border rounded-md px-4 bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800" data-testid="accordion-conduct">
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                <span className="font-semibold">Fair Play & Disqualification</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground space-y-2 pt-4">
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" />
                                <p>Suspected cheating will result in immediate disqualification</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" />
                                <p>Admin decisions are final and binding</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" />
                                <p>Players must join match within 5 minutes of start time</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" />
                                <p>Late entries will not be accommodated</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" />
                                <p>Disconnections due to network issues are player's responsibility</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" />
                                <p>Any dispute must be raised within 1 hour of match completion</p>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Registration Form */}
                  {tournamentData.registeredCount < tournamentData.maxSlots ? (
                    <RegistrationForm
                      gameType={gameType}
                      tournamentType={mode as TournamentType}
                      qrCodeUrl={tournamentData.qrCodeUrl || "/attached_assets/payment-qr.jpg"}
                      onSubmit={handleSubmit}
                      isSubmitting={createRegistrationMutation.isPending}
                    />
                  ) : (
                    <Card className="border-destructive/50">
                      <CardContent className="pt-6">
                        <div className="text-center py-8 space-y-4">
                          <AlertCircle className="w-16 h-16 mx-auto text-destructive" />
                          <h3 className="text-2xl font-bold">Tournament Full</h3>
                          <p className="text-muted-foreground">
                            All slots for this tournament have been filled. Please check other modes or try again later.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Quick Info */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Card className={`${gameBorder} border-l-4`}>
                      <CardContent className="pt-6 space-y-4">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Info className={`w-5 h-5 ${gameColor}`} />
                          Tournament Info
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 gap-3">
                            <div className="flex items-center gap-2">
                              <Target className={`w-4 h-4 ${gameColor}`} />
                              <span className="text-sm text-muted-foreground">Mode</span>
                            </div>
                            <Badge className={`${gameBgLight} ${gameColor} border-0 capitalize`} data-testid={`badge-mode-${mode}`}>{mode}</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 gap-3">
                            <div className="flex items-center gap-2">
                              <Coins className={`w-4 h-4 ${gameColor}`} />
                              <span className="text-sm text-muted-foreground">Entry Fee</span>
                            </div>
                            <span className={`font-bold ${gameColor}`} data-testid="text-entry-fee">₹{config.entryFee}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 gap-3">
                            <div className="flex items-center gap-2">
                              <Users className={`w-4 h-4 ${gameColor}`} />
                              <span className="text-sm text-muted-foreground">Max Slots</span>
                            </div>
                            <span className="font-semibold" data-testid="text-max-slots">{tournamentData.maxSlots}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 gap-3">
                            <div className="flex items-center gap-2">
                              <UserCircle className={`w-4 h-4 ${gameColor}`} />
                              <span className="text-sm text-muted-foreground">Team Size</span>
                            </div>
                            <span className="font-semibold" data-testid="text-team-size">{config.maxPlayers} {config.maxPlayers === 1 ? "Player" : "Players"}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Prize Pool */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <Card className="border-success/50 border-2">
                      <CardContent className="pt-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-success" />
                          Prize Pool
                        </h3>
                        <div className="space-y-3">
                          {/* Winner - Highlighted */}
                          <motion.div 
                            className="relative overflow-hidden p-4 rounded-md bg-gradient-to-br from-success/20 to-success/10 border-2 border-success"
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-success/20">
                                  <Award className="w-5 h-5 text-success" />
                                </div>
                                <div>
                                  <div className="text-xs text-success font-medium uppercase">Winner</div>
                                  <div className="text-sm text-muted-foreground">1st Place</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-3xl font-black text-success" data-testid="text-prize-winner">₹{config.winner}</div>
                              </div>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full -mr-16 -mt-16" />
                          </motion.div>

                          {/* Runner Up */}
                          <div className="flex items-center justify-between p-3 rounded-md bg-muted/80 border border-border">
                            <div className="flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Runner Up</span>
                            </div>
                            <span className="text-xl font-bold" data-testid="text-prize-runner">₹{config.runnerUp}</span>
                          </div>

                          {/* Per Kill */}
                          <div className="flex items-center justify-between p-3 rounded-md bg-muted/80 border border-border">
                            <div className="flex items-center gap-2">
                              <Swords className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Per Kill</span>
                            </div>
                            <span className="text-xl font-bold" data-testid="text-prize-kill">₹{config.perKill}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Support */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <Card>
                      <CardContent className="pt-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Zap className={`w-5 h-5 ${gameColor}`} />
                          Need Help?
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Contact support for any queries regarding registration or tournament rules.
                        </p>
                        <Badge variant="outline" className={`w-full justify-center py-3 ${gameBorder} ${gameColor} hover:${gameBgLight}`} data-testid="badge-support">
                          Support Available 24/7
                        </Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </div>
            </TabsContent>
          );
          })}
        </Tabs>
      </div>
    </div>
  );
}
