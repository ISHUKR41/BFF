import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Trophy, Users, Shield, Target, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SlotCounter } from "@/components/SlotCounter";
import { RegistrationForm } from "@/components/RegistrationForm";
import { type GameType, type TournamentType, type Tournament, TOURNAMENT_CONFIG } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import bgmiBanner from "@assets/generated_images/BGMI_tournament_hero_banner_fb19ed0b.png";
import freeFireBanner from "@assets/generated_images/Free_Fire_tournament_hero_banner_e185d070.png";

interface TournamentPageProps {
  gameType: GameType;
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
  const gameColor = gameType === "bgmi" ? "bgmi" : "freefire";

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

  const bannerImage = gameType === "bgmi" ? bgmiBanner : freeFireBanner;

  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      {/* Hero Banner */}
      <div className="relative h-64 md:h-80 overflow-hidden mb-8">
        <img 
          src={bannerImage} 
          alt={`${gameTitle} Tournament Banner`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className={`w-10 h-10 md:w-12 md:h-12 text-${gameColor}`} />
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white drop-shadow-lg">
                {gameTitle} Tournament
              </h1>
            </div>
            <p className="text-lg md:text-xl text-white/90 drop-shadow-md max-w-2xl mx-auto px-4">
              Choose your tournament mode and register to compete with the best players
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">

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
                  <Card>
                    <CardContent className="pt-6">
                      <h2 className="text-2xl font-bold mb-6">Rules & Regulations</h2>
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="general">
                          <AccordionTrigger>General Rules</AccordionTrigger>
                          <AccordionContent className="text-muted-foreground space-y-2">
                            <p>• All matches must be played on the latest official version of {gameTitle}</p>
                            <p>• Only mobile phones are allowed. Emulators, tablets are strictly prohibited</p>
                            <p>• Players must ensure stable internet connection before starting</p>
                            <p>• No use of hacks, mod APKs, or third-party software</p>
                            <p>• No teaming with players outside your registered team</p>
                            <p>• Respectful behavior is mandatory - no abuse or toxic behavior</p>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="registration">
                          <AccordionTrigger>Registration & Payment</AccordionTrigger>
                          <AccordionContent className="text-muted-foreground space-y-2">
                            <p>• Entry fee: ₹{config.entryFee} per {mode === "solo" ? "player" : "team"}</p>
                            <p>• Payment must be completed via UPI to the provided QR code</p>
                            <p>• Upload clear payment screenshot with visible transaction ID</p>
                            <p>• Registration will be confirmed after admin approval</p>
                            <p>• Room ID and password will be shared 30 minutes before match</p>
                            <p>• No refunds after registration approval</p>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="prizes">
                          <AccordionTrigger>Prize Structure</AccordionTrigger>
                          <AccordionContent className="text-muted-foreground space-y-2">
                            <p>• Winner: ₹{config.winner}</p>
                            <p>• Runner Up: ₹{config.runnerUp}</p>
                            <p>• Per Kill: ₹{config.perKill}</p>
                            <p>• Prizes will be transferred within 24 hours of match completion</p>
                            <p>• Winners must provide valid UPI details for prize transfer</p>
                            <p>• Screenshot verification may be required for prize claims</p>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="conduct">
                          <AccordionTrigger>Fair Play & Disqualification</AccordionTrigger>
                          <AccordionContent className="text-muted-foreground space-y-2">
                            <p>• Suspected cheating will result in immediate disqualification</p>
                            <p>• Admin decisions are final and binding</p>
                            <p>• Players must join match within 5 minutes of start time</p>
                            <p>• Late entries will not be accommodated</p>
                            <p>• Disconnections due to network issues are player's responsibility</p>
                            <p>• Any dispute must be raised within 1 hour of match completion</p>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>

                  {/* Registration Form */}
                  {tournamentData.registeredCount < tournamentData.maxSlots ? (
                    <RegistrationForm
                      gameType={gameType}
                      tournamentType={mode as TournamentType}
                      qrCodeUrl={tournamentData.qrCodeUrl || "https://via.placeholder.com/200x200.png?text=QR+Code"}
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
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <h3 className="text-lg font-semibold mb-4">Tournament Info</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Mode</span>
                          <Badge variant="secondary" className="capitalize">{mode}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Entry Fee</span>
                          <span className="font-semibold">₹{config.entryFee}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Max Slots</span>
                          <span className="font-semibold">{tournamentData.maxSlots}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Team Size</span>
                          <span className="font-semibold">{config.maxPlayers} {config.maxPlayers === 1 ? "Player" : "Players"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Prize Pool */}
                  <Card className="border-success/50">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-success" />
                        Prize Pool
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-md bg-success/10">
                          <span className="text-sm font-medium">Winner</span>
                          <span className="text-lg font-bold text-success">₹{config.winner}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-md bg-muted">
                          <span className="text-sm font-medium">Runner Up</span>
                          <span className="text-lg font-bold">₹{config.runnerUp}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-md bg-muted">
                          <span className="text-sm font-medium">Per Kill</span>
                          <span className="text-lg font-bold">₹{config.perKill}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Support */}
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold mb-4">Need Help?</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Contact support for any queries regarding registration or tournament rules.
                      </p>
                      <Badge variant="outline" className="w-full justify-center py-2">
                        Support Available
                      </Badge>
                    </CardContent>
                  </Card>
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
