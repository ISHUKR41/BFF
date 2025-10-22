import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Upload, Loader2 } from "lucide-react";
import { type GameType, type TournamentType, TOURNAMENT_CONFIG } from "@shared/schema";

interface RegistrationFormProps {
  gameType: GameType;
  tournamentType: TournamentType;
  qrCodeUrl?: string;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
}

export function RegistrationForm({ gameType, tournamentType, qrCodeUrl, onSubmit, isSubmitting }: RegistrationFormProps) {
  const [screenshotPreview, setScreenshotPreview] = useState<string>("");
  const config = TOURNAMENT_CONFIG[gameType][tournamentType];

  const formSchema = z.object({
    teamName: tournamentType !== "solo" ? z.string().min(1, "Team name is required") : z.string().optional(),
    playerName: z.string().min(1, "Player name is required"),
    gameId: z.string().min(1, "Game ID is required"),
    whatsapp: z.string().min(10, "Valid WhatsApp number required").max(13),
    player2Name: config.maxPlayers >= 2 ? z.string().min(1, "Player 2 name is required") : z.string().optional(),
    player2GameId: config.maxPlayers >= 2 ? z.string().min(1, "Player 2 Game ID is required") : z.string().optional(),
    player3Name: config.maxPlayers >= 3 ? z.string().min(1, "Player 3 name is required") : z.string().optional(),
    player3GameId: config.maxPlayers >= 3 ? z.string().min(1, "Player 3 Game ID is required") : z.string().optional(),
    player4Name: config.maxPlayers >= 4 ? z.string().min(1, "Player 4 name is required") : z.string().optional(),
    player4GameId: config.maxPlayers >= 4 ? z.string().min(1, "Player 4 Game ID is required") : z.string().optional(),
    paymentScreenshot: z.string().optional(),
    transactionId: z.string().min(1, "Transaction ID is required"),
  });

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamName: "",
      playerName: "",
      gameId: "",
      whatsapp: "",
      player2Name: "",
      player2GameId: "",
      player3Name: "",
      player3GameId: "",
      player4Name: "",
      player4GameId: "",
      paymentScreenshot: "",
      transactionId: "",
    },
  });

  const handleSubmit = async (data: FormData) => {
    await onSubmit({
      ...data,
      gameType,
      tournamentType,
      status: "pending",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setScreenshotPreview(base64);
        form.setValue("paymentScreenshot", base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registration Form</CardTitle>
        <CardDescription>Fill in all details carefully to complete your registration</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Team Name (Duo/Squad only) */}
            {tournamentType !== "solo" && (
              <FormField
                control={form.control}
                name="teamName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter your team name" data-testid="input-team-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Player 1 (Team Leader / Solo Player) */}
            <div className="space-y-4 p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Player 1 {tournamentType !== "solo" && "(Team Leader)"}</Badge>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="playerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Player Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter name" data-testid="input-player1-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gameId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Game ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter game ID" data-testid="input-player1-gameid" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter WhatsApp number" data-testid="input-whatsapp" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Player 2 (Duo/Squad) */}
            {config.maxPlayers >= 2 && (
              <div className="space-y-4 p-4 rounded-lg bg-muted/50 border border-border">
                <Badge variant="secondary">Player 2</Badge>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="player2Name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Player Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter name" data-testid="input-player2-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="player2GameId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Game ID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter game ID" data-testid="input-player2-gameid" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Player 3 (Squad) */}
            {config.maxPlayers >= 3 && (
              <div className="space-y-4 p-4 rounded-lg bg-muted/50 border border-border">
                <Badge variant="secondary">Player 3</Badge>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="player3Name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Player Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter name" data-testid="input-player3-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="player3GameId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Game ID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter game ID" data-testid="input-player3-gameid" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Player 4 (Squad) */}
            {config.maxPlayers >= 4 && (
              <div className="space-y-4 p-4 rounded-lg bg-muted/50 border border-border">
                <Badge variant="secondary">Player 4</Badge>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="player4Name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Player Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter name" data-testid="input-player4-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="player4GameId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Game ID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter game ID" data-testid="input-player4-gameid" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Payment Section */}
            <div className="space-y-4 p-6 rounded-lg bg-primary/5 border-2 border-primary/20">
              <h3 className="text-lg font-semibold">Payment Details</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-md bg-background border border-border">
                  <span className="text-sm font-medium">Entry Fee</span>
                  <span className="text-xl font-bold text-primary">₹{config.entryFee}</span>
                </div>

                {qrCodeUrl && (
                  <div className="text-center space-y-2">
                    <Label>Scan QR Code to Pay</Label>
                    <div className="inline-block p-4 rounded-lg bg-white">
                      <img src={qrCodeUrl} alt="Payment QR Code" className="w-48 h-48 mx-auto" />
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="paymentScreenshot"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Screenshot</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover-elevate active-elevate-2 bg-muted/30">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              {screenshotPreview ? (
                                <img src={screenshotPreview} alt="Preview" className="h-20 object-contain" />
                              ) : (
                                <>
                                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                  <p className="text-xs text-muted-foreground">Click to upload screenshot</p>
                                </>
                              )}
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileChange}
                              data-testid="input-payment-screenshot"
                            />
                          </label>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="transactionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction ID / UTR Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter transaction ID" className="font-mono" data-testid="input-transaction-id" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting} data-testid="button-submit-registration">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Complete Registration"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
