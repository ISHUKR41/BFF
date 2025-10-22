import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Upload, Loader2, Check, Info, X, ImagePlus, AlertCircle } from "lucide-react";
import { type GameType, type TournamentType, TOURNAMENT_CONFIG } from "@shared/schema";

interface RegistrationFormProps {
  gameType: GameType;
  tournamentType: TournamentType;
  qrCodeUrl?: string;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

export function RegistrationForm({ gameType, tournamentType, qrCodeUrl, onSubmit, isSubmitting }: RegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [screenshotPreview, setScreenshotPreview] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [fileError, setFileError] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const config = TOURNAMENT_CONFIG[gameType][tournamentType];
  const formKey = `registration-form-${gameType}-${tournamentType}`;

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
    mode: "onChange",
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

  // Load form data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(formKey);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        Object.keys(parsedData).forEach((key) => {
          form.setValue(key as keyof FormData, parsedData[key]);
        });
        if (parsedData.paymentScreenshot) {
          setScreenshotPreview(parsedData.paymentScreenshot);
        }
        if (parsedData.fileName) {
          setFileName(parsedData.fileName);
        }
        if (parsedData.fileSize) {
          setFileSize(parsedData.fileSize);
        }
      } catch (error) {
        console.error("Error loading saved form data:", error);
      }
    }
  }, [formKey, form]);

  // Auto-save form data to localStorage
  useEffect(() => {
    const subscription = form.watch((value) => {
      const dataToSave = {
        ...value,
        fileName,
        fileSize,
      };
      localStorage.setItem(formKey, JSON.stringify(dataToSave));
      setHasUnsavedChanges(true);
    });
    return () => subscription.unsubscribe();
  }, [form, formKey, fileName, fileSize]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isSubmitting) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, isSubmitting]);

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          const maxDimension = 1200;
          if (width > height && width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            
            // Compress with quality based on file size
            let quality = 0.7;
            if (file.size > 2 * 1024 * 1024) quality = 0.5;
            if (file.size > 4 * 1024 * 1024) quality = 0.3;

            const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
            resolve(compressedBase64);
          } else {
            reject(new Error("Could not get canvas context"));
          }
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileError("");
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`File size exceeds 5MB. Please upload a smaller image.`);
        setFileName("");
        setFileSize(0);
        setScreenshotPreview("");
        form.setValue("paymentScreenshot", "");
        return;
      }

      setFileName(file.name);
      setFileSize(file.size);

      try {
        // Compress image if it's large
        const base64 = file.size > 1024 * 1024 ? await compressImage(file) : await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        setScreenshotPreview(base64);
        form.setValue("paymentScreenshot", base64);
      } catch (error) {
        setFileError("Failed to process image. Please try another file.");
        console.error("Error processing image:", error);
      }
    }
  };

  const removeFile = () => {
    setScreenshotPreview("");
    setFileName("");
    setFileSize(0);
    setFileError("");
    form.setValue("paymentScreenshot", "");
  };

  const handleSubmit = async (data: FormData) => {
    setCurrentStep(3);
    await onSubmit({
      ...data,
      gameType,
      tournamentType,
      status: "pending",
    });
    setHasUnsavedChanges(false);
    localStorage.removeItem(formKey);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const isFieldValid = (fieldName: keyof FormData): boolean => {
    const value = form.watch(fieldName);
    const error = form.formState.errors[fieldName];
    return !!value && !error && value.toString().length > 0;
  };

  const steps = [
    { number: 1, title: "Team/Player Details", completed: currentStep > 1 },
    { number: 2, title: "Payment Details", completed: currentStep > 2 },
    { number: 3, title: "Review & Submit", completed: currentStep > 3 },
  ];

  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registration Form</CardTitle>
        <CardDescription>Fill in all details carefully to complete your registration</CardDescription>
        
        {/* Multi-step Progress Indicator */}
        <div className="mt-6 space-y-4" data-testid="progress-indicator">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      currentStep >= step.number
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-background border-border text-muted-foreground"
                    } ${step.completed ? "bg-green-500 border-green-500" : ""}`}
                    data-testid={`step-indicator-${step.number}`}
                  >
                    {step.completed ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-sm font-semibold">{step.number}</span>
                    )}
                  </div>
                  <span className={`text-xs mt-2 text-center ${currentStep >= step.number ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 bg-border relative" style={{ top: "-20px" }}>
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: currentStep > step.number ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <Progress value={progressPercentage} className="h-2" data-testid="progress-bar" />
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Step 1: Team/Player Details */}
            {currentStep === 1 && (
              <div className="space-y-6" data-testid="step-team-player-details">
                {/* Team Name (Duo/Squad only) */}
                {tournamentType !== "solo" && (
                  <FormField
                    control={form.control}
                    name="teamName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Team Name
                          <span className="text-destructive">*</span>
                          {isFieldValid("teamName") && <Check className="w-4 h-4 text-green-500" data-testid="check-team-name" />}
                        </FormLabel>
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
                          <FormLabel className="flex items-center gap-2">
                            Player Name
                            <span className="text-destructive">*</span>
                            {isFieldValid("playerName") && <Check className="w-4 h-4 text-green-500" data-testid="check-player-name" />}
                          </FormLabel>
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
                          <FormLabel className="flex items-center gap-2">
                            Game ID
                            <span className="text-destructive">*</span>
                            {isFieldValid("gameId") && <Check className="w-4 h-4 text-green-500" data-testid="check-game-id" />}
                          </FormLabel>
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
                        <FormLabel className="flex items-center gap-2">
                          WhatsApp Number
                          <span className="text-destructive">*</span>
                          {isFieldValid("whatsapp") && <Check className="w-4 h-4 text-green-500" data-testid="check-whatsapp" />}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-4 h-4 text-muted-foreground cursor-help" data-testid="info-whatsapp" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>We'll send match details and updates here</p>
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter WhatsApp number" data-testid="input-whatsapp" />
                        </FormControl>
                        <FormDescription>We'll send match details here</FormDescription>
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
                            <FormLabel className="flex items-center gap-2">
                              Player Name
                              <span className="text-destructive">*</span>
                              {isFieldValid("player2Name") && <Check className="w-4 h-4 text-green-500" data-testid="check-player2-name" />}
                            </FormLabel>
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
                            <FormLabel className="flex items-center gap-2">
                              Game ID
                              <span className="text-destructive">*</span>
                              {isFieldValid("player2GameId") && <Check className="w-4 h-4 text-green-500" data-testid="check-player2-gameid" />}
                            </FormLabel>
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
                            <FormLabel className="flex items-center gap-2">
                              Player Name
                              <span className="text-destructive">*</span>
                              {isFieldValid("player3Name") && <Check className="w-4 h-4 text-green-500" data-testid="check-player3-name" />}
                            </FormLabel>
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
                            <FormLabel className="flex items-center gap-2">
                              Game ID
                              <span className="text-destructive">*</span>
                              {isFieldValid("player3GameId") && <Check className="w-4 h-4 text-green-500" data-testid="check-player3-gameid" />}
                            </FormLabel>
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
                            <FormLabel className="flex items-center gap-2">
                              Player Name
                              <span className="text-destructive">*</span>
                              {isFieldValid("player4Name") && <Check className="w-4 h-4 text-green-500" data-testid="check-player4-name" />}
                            </FormLabel>
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
                            <FormLabel className="flex items-center gap-2">
                              Game ID
                              <span className="text-destructive">*</span>
                              {isFieldValid("player4GameId") && <Check className="w-4 h-4 text-green-500" data-testid="check-player4-gameid" />}
                            </FormLabel>
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

                <Button
                  type="button"
                  className="w-full"
                  size="lg"
                  onClick={() => setCurrentStep(2)}
                  data-testid="button-next-step"
                >
                  Continue to Payment
                </Button>
              </div>
            )}

            {/* Step 2: Payment Details */}
            {currentStep === 2 && (
              <div className="space-y-6" data-testid="step-payment-details">
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
                          <FormLabel className="flex items-center gap-2">
                            Payment Screenshot
                            <span className="text-muted-foreground text-xs">(Optional)</span>
                            {screenshotPreview && <Check className="w-4 h-4 text-green-500" data-testid="check-screenshot" />}
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              {fileError && (
                                <Alert variant="destructive" data-testid="alert-file-error">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertDescription>{fileError}</AlertDescription>
                                </Alert>
                              )}
                              
                              {!screenshotPreview ? (
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover-elevate active-elevate-2 bg-muted/30">
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">Click to upload screenshot</p>
                                    <p className="text-xs text-muted-foreground mt-1">Max size: 5MB</p>
                                  </div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    data-testid="input-payment-screenshot"
                                  />
                                </label>
                              ) : (
                                <div className="space-y-3">
                                  <div className="relative rounded-lg border border-border p-4 bg-muted/30">
                                    <img src={screenshotPreview} alt="Preview" className="w-full h-40 object-contain rounded" />
                                  </div>
                                  <div className="flex items-center justify-between p-3 rounded-md bg-background border border-border">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <ImagePlus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate" data-testid="text-file-name">{fileName}</p>
                                        <p className="text-xs text-muted-foreground" data-testid="text-file-size">{formatFileSize(fileSize)}</p>
                                      </div>
                                    </div>
                                    <div className="flex gap-2 ml-2">
                                      <label>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          asChild
                                          data-testid="button-change-image"
                                        >
                                          <span className="cursor-pointer">Change</span>
                                        </Button>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={handleFileChange}
                                        />
                                      </label>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={removeFile}
                                        data-testid="button-remove-image"
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
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
                          <FormLabel className="flex items-center gap-2">
                            Transaction ID / UTR Number
                            <span className="text-destructive">*</span>
                            {isFieldValid("transactionId") && <Check className="w-4 h-4 text-green-500" data-testid="check-transaction-id" />}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="w-4 h-4 text-muted-foreground cursor-help" data-testid="info-transaction-id" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Found in your payment app after completing payment</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter transaction ID" className="font-mono" data-testid="input-transaction-id" />
                          </FormControl>
                          <FormDescription>Found in your payment app after completing payment</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    size="lg"
                    onClick={() => setCurrentStep(1)}
                    data-testid="button-back-step"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    size="lg"
                    disabled={isSubmitting}
                    data-testid="button-submit-registration"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Complete Registration"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Submit (shown during submission) */}
            {currentStep === 3 && (
              <div className="text-center space-y-4" data-testid="step-review-submit">
                <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
                <h3 className="text-lg font-semibold">Processing Your Registration...</h3>
                <p className="text-muted-foreground">Please wait while we submit your registration</p>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
