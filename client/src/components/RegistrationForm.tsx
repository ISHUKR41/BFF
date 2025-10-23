import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PatternFormat } from "react-number-format";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
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
  onSuccess?: () => void;
  isSubmitting: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function RegistrationForm({ gameType, tournamentType, qrCodeUrl, onSubmit, onSuccess, isSubmitting }: RegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [screenshotPreview, setScreenshotPreview] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [fileError, setFileError] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const config = TOURNAMENT_CONFIG[gameType][tournamentType];
  const formKey = `registration-form-${gameType}-${tournamentType}`;
  const globalFormKey = `registration-form-global`;

  const gameColor = gameType === "bgmi" ? "text-bgmi" : "text-freefire";
  const gameBg = gameType === "bgmi" ? "bg-bgmi" : "bg-freefire";
  const gameBgLight = gameType === "bgmi" ? "bg-bgmi/10" : "bg-freefire/10";
  const gameBorder = gameType === "bgmi" ? "border-bgmi" : "border-freefire";
  const gameBorderLight = gameType === "bgmi" ? "border-bgmi/30" : "border-freefire/30";

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
    mode: "onBlur", // Change from onChange to onBlur to reduce re-renders
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

  useEffect(() => {
    // Load global form data first
    const globalSavedData = localStorage.getItem(globalFormKey);
    if (globalSavedData) {
      try {
        const parsedData = JSON.parse(globalSavedData);
        // Only load data for the current game and tournament type
        if (parsedData.gameType === gameType && parsedData.tournamentType === tournamentType) {
          Object.keys(parsedData).forEach((key) => {
            if (key !== 'gameType' && key !== 'tournamentType') {
              form.setValue(key as keyof FormData, parsedData[key]);
            }
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
        }
      } catch (error) {
        console.error("Error loading global form data:", error);
      }
    }
    
    // Load specific form data
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
  }, [formKey, globalFormKey, gameType, tournamentType, form]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      const dataToSave = {
        ...value,
        fileName,
        fileSize,
        gameType,
        tournamentType,
      };
      // Save to specific form key
      localStorage.setItem(formKey, JSON.stringify(dataToSave));
      // Save to global form key for cross-page persistence
      localStorage.setItem(globalFormKey, JSON.stringify(dataToSave));
      setHasUnsavedChanges(true);
    });
    return () => subscription.unsubscribe();
  }, [form, formKey, globalFormKey, fileName, fileSize, gameType, tournamentType]);

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

          // Reduced max dimension for faster compression
          const maxDimension = 800;
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
            
            // More aggressive compression for better performance
            let quality = 0.6;
            if (file.size > 2 * 1024 * 1024) quality = 0.4;
            if (file.size > 4 * 1024 * 1024) quality = 0.2;

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

  const processFile = async (file: File) => {
    setFileError("");
    
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
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      await processFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    multiple: false,
  });

  const removeFile = () => {
    setScreenshotPreview("");
    setFileName("");
    setFileSize(0);
    setFileError("");
    form.setValue("paymentScreenshot", "");
  };

  const clearAllFormData = () => {
    // Clear all tournament form data from localStorage
    const formKeys = [
      'registration-form-bgmi-solo',
      'registration-form-bgmi-duo',
      'registration-form-bgmi-squad',
      'registration-form-freefire-solo',
      'registration-form-freefire-duo',
      'registration-form-freefire-squad',
      'registration-form-global',
    ];
    
    formKeys.forEach(key => localStorage.removeItem(key));
  };

  const handleSubmit = async (data: FormData) => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      setCurrentStep(3);
      
      // Add timeout for submission to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Submission timeout")), 30000);
      });
      
      await Promise.race([
        onSubmit({
          ...data,
          gameType,
          tournamentType,
          status: "pending",
        }),
        timeoutPromise
      ]);
      
      // Clear timeout on successful submission
      if (timeoutId) clearTimeout(timeoutId);
      
      // Reset form state after successful submission
      form.reset();
      setScreenshotPreview("");
      setFileName("");
      setFileSize(0);
      setFileError("");
      setCurrentStep(1);
      setHasUnsavedChanges(false);
      
      // Clear ALL tournament form data from localStorage after successful submission
      clearAllFormData();
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Clear timeout on error
      if (timeoutId) clearTimeout(timeoutId);
      
      // On error, go back to step 2 so user can retry
      setCurrentStep(2);
      console.error("Submission error:", error);
    }
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

  const canProceedToStep2 = (): boolean => {
    const requiredFields: (keyof FormData)[] = ["playerName", "gameId", "whatsapp"];
    
    if (tournamentType !== "solo") {
      requiredFields.push("teamName");
    }
    
    if (config.maxPlayers >= 2) {
      requiredFields.push("player2Name", "player2GameId");
    }
    
    if (config.maxPlayers >= 3) {
      requiredFields.push("player3Name", "player3GameId");
    }
    
    if (config.maxPlayers >= 4) {
      requiredFields.push("player4Name", "player4GameId");
    }
    
    return requiredFields.every(fieldName => isFieldValid(fieldName));
  };

  const canProceedToStep3 = (): boolean => {
    return isFieldValid("transactionId");
  };

  const steps = [
    { number: 1, title: "Team/Player Details", completed: currentStep > 1 },
    { number: 2, title: "Payment Details", completed: currentStep > 2 },
    { number: 3, title: "Review & Submit", completed: currentStep > 3 },
  ];

  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  const fieldVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
        ease: "easeOut"
      }
    })
  };

  const checkmarkVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: { 
      scale: 1, 
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };

  return (
    <Card className={`${gameBorder} border-t-4`}>
      <CardHeader>
        <CardTitle className="text-2xl">Registration Form</CardTitle>
        <CardDescription className="text-base">Fill in all details carefully to complete your registration</CardDescription>
        
        <div className="mt-6 space-y-5" data-testid="progress-indicator">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <motion.div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      currentStep >= step.number
                        ? `${gameBg} ${gameBorder} text-white`
                        : "bg-background border-border text-muted-foreground"
                    } ${step.completed ? `${gameBg} ${gameBorder}` : ""}`}
                    data-testid={`step-indicator-${step.number}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <AnimatePresence mode="wait">
                      {step.completed ? (
                        <motion.div
                          key="check"
                          variants={checkmarkVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                        >
                          <Check className="w-6 h-6 text-white" />
                        </motion.div>
                      ) : (
                        <motion.span
                          key="number"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-base font-bold"
                        >
                          {step.number}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <span className={`text-xs mt-2 text-center font-medium ${currentStep >= step.number ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-1 mx-3 bg-border rounded-full relative" style={{ top: "-20px" }}>
                    <motion.div
                      className={`h-full ${gameBg} rounded-full`}
                      initial={{ width: "0%" }}
                      animate={{ width: currentStep > step.number ? "100%" : "0%" }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="relative">
            <Progress value={progressPercentage} className="h-2" data-testid="progress-bar" />
            <motion.div
              className={`absolute top-0 left-0 h-full ${gameBg} rounded-full`}
              initial={{ width: "0%" }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              style={{ zIndex: 10 }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                  data-testid="step-team-player-details"
                >
                  {tournamentType !== "solo" && (
                    <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
                      <FormField
                        control={form.control}
                        name="teamName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-base">
                              Team Name
                              <span className="text-destructive">*</span>
                              <AnimatePresence>
                                {isFieldValid("teamName") && (
                                  <motion.div
                                    variants={checkmarkVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                  >
                                    <Check className={`w-4 h-4 ${gameColor}`} data-testid="check-team-name" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter your team name" className="h-11" data-testid="input-team-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  )}

                  <motion.div 
                    custom={tournamentType !== "solo" ? 1 : 0} 
                    variants={fieldVariants} 
                    initial="hidden" 
                    animate="visible"
                    className={`space-y-5 p-6 rounded-lg ${gameBgLight} border-2 ${gameBorderLight}`}
                  >
                    <div className="flex items-center gap-2">
                      <Badge className={`${gameBg} text-white`}>
                        Player 1 {tournamentType !== "solo" && "(Team Leader)"}
                      </Badge>
                    </div>
                    <div className="grid md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="playerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-base">
                              Player Name
                              <span className="text-destructive">*</span>
                              <AnimatePresence>
                                {isFieldValid("playerName") && (
                                  <motion.div variants={checkmarkVariants} initial="hidden" animate="visible" exit="hidden">
                                    <Check className={`w-4 h-4 ${gameColor}`} data-testid="check-player-name" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter name" className="h-11" data-testid="input-player1-name" />
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
                            <FormLabel className="flex items-center gap-2 text-base">
                              Game ID
                              <span className="text-destructive">*</span>
                              <AnimatePresence>
                                {isFieldValid("gameId") && (
                                  <motion.div variants={checkmarkVariants} initial="hidden" animate="visible" exit="hidden">
                                    <Check className={`w-4 h-4 ${gameColor}`} data-testid="check-game-id" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter game ID" className="h-11" data-testid="input-player1-gameid" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-base">
                        WhatsApp Number
                        <span className="text-destructive">*</span>
                        <AnimatePresence>
                          {isFieldValid("whatsapp") && (
                            <motion.div variants={checkmarkVariants} initial="hidden" animate="visible" exit="hidden">
                              <Check className={`w-4 h-4 ${gameColor}`} data-testid="check-whatsapp" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" data-testid="info-whatsapp" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>We'll send match details and updates here</p>
                          </TooltipContent>
                        </Tooltip>
                      </FormLabel>
                      <Controller
                        control={form.control}
                        name="whatsapp"
                        render={({ field }) => (
                          <PatternFormat
                            value={field.value}
                            format="+91 ##### #####"
                            mask="_"
                            placeholder="+91 XXXXX XXXXX"
                            customInput={Input}
                            className="h-11"
                            data-testid="input-whatsapp"
                            onValueChange={(values) => {
                              field.onChange(values.value);
                            }}
                          />
                        )}
                      />
                      <FormDescription>We'll send match details here</FormDescription>
                      {form.formState.errors.whatsapp && (
                        <p className="text-sm font-medium text-destructive">{form.formState.errors.whatsapp.message}</p>
                      )}
                    </FormItem>
                  </motion.div>

                  {config.maxPlayers >= 2 && (
                    <motion.div 
                      custom={tournamentType !== "solo" ? 2 : 1} 
                      variants={fieldVariants} 
                      initial="hidden" 
                      animate="visible"
                      className={`space-y-5 p-6 rounded-lg ${gameBgLight} border-2 ${gameBorderLight}`}
                    >
                      <Badge className={`${gameBg} text-white`}>Player 2</Badge>
                      <div className="grid md:grid-cols-2 gap-5">
                        <FormField
                          control={form.control}
                          name="player2Name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 text-base">
                                Player Name
                                <span className="text-destructive">*</span>
                                <AnimatePresence>
                                  {isFieldValid("player2Name") && (
                                    <motion.div variants={checkmarkVariants} initial="hidden" animate="visible" exit="hidden">
                                      <Check className={`w-4 h-4 ${gameColor}`} data-testid="check-player2-name" />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter name" className="h-11" data-testid="input-player2-name" />
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
                              <FormLabel className="flex items-center gap-2 text-base">
                                Game ID
                                <span className="text-destructive">*</span>
                                <AnimatePresence>
                                  {isFieldValid("player2GameId") && (
                                    <motion.div variants={checkmarkVariants} initial="hidden" animate="visible" exit="hidden">
                                      <Check className={`w-4 h-4 ${gameColor}`} data-testid="check-player2-gameid" />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter game ID" className="h-11" data-testid="input-player2-gameid" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </motion.div>
                  )}

                  {config.maxPlayers >= 3 && (
                    <motion.div 
                      custom={tournamentType !== "solo" ? 3 : 2} 
                      variants={fieldVariants} 
                      initial="hidden" 
                      animate="visible"
                      className={`space-y-5 p-6 rounded-lg ${gameBgLight} border-2 ${gameBorderLight}`}
                    >
                      <Badge className={`${gameBg} text-white`}>Player 3</Badge>
                      <div className="grid md:grid-cols-2 gap-5">
                        <FormField
                          control={form.control}
                          name="player3Name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 text-base">
                                Player Name
                                <span className="text-destructive">*</span>
                                <AnimatePresence>
                                  {isFieldValid("player3Name") && (
                                    <motion.div variants={checkmarkVariants} initial="hidden" animate="visible" exit="hidden">
                                      <Check className={`w-4 h-4 ${gameColor}`} data-testid="check-player3-name" />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter name" className="h-11" data-testid="input-player3-name" />
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
                              <FormLabel className="flex items-center gap-2 text-base">
                                Game ID
                                <span className="text-destructive">*</span>
                                <AnimatePresence>
                                  {isFieldValid("player3GameId") && (
                                    <motion.div variants={checkmarkVariants} initial="hidden" animate="visible" exit="hidden">
                                      <Check className={`w-4 h-4 ${gameColor}`} data-testid="check-player3-gameid" />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter game ID" className="h-11" data-testid="input-player3-gameid" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </motion.div>
                  )}

                  {config.maxPlayers >= 4 && (
                    <motion.div 
                      custom={tournamentType !== "solo" ? 4 : 3} 
                      variants={fieldVariants} 
                      initial="hidden" 
                      animate="visible"
                      className={`space-y-5 p-6 rounded-lg ${gameBgLight} border-2 ${gameBorderLight}`}
                    >
                      <Badge className={`${gameBg} text-white`}>Player 4</Badge>
                      <div className="grid md:grid-cols-2 gap-5">
                        <FormField
                          control={form.control}
                          name="player4Name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 text-base">
                                Player Name
                                <span className="text-destructive">*</span>
                                <AnimatePresence>
                                  {isFieldValid("player4Name") && (
                                    <motion.div variants={checkmarkVariants} initial="hidden" animate="visible" exit="hidden">
                                      <Check className={`w-4 h-4 ${gameColor}`} data-testid="check-player4-name" />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter name" className="h-11" data-testid="input-player4-name" />
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
                              <FormLabel className="flex items-center gap-2 text-base">
                                Game ID
                                <span className="text-destructive">*</span>
                                <AnimatePresence>
                                  {isFieldValid("player4GameId") && (
                                    <motion.div variants={checkmarkVariants} initial="hidden" animate="visible" exit="hidden">
                                      <Check className={`w-4 h-4 ${gameColor}`} data-testid="check-player4-gameid" />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter game ID" className="h-11" data-testid="input-player4-gameid" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-3">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="button"
                        className={`w-full h-12 text-base font-semibold ${gameBg} hover:opacity-90`}
                        size="lg"
                        onClick={() => setCurrentStep(2)}
                        disabled={!canProceedToStep2()}
                        data-testid="button-next-step"
                      >
                        Continue to Payment
                      </Button>
                    </motion.div>
                    {!canProceedToStep2() && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-sm ${gameColor} text-center p-3 rounded-md ${gameBgLight} border ${gameBorderLight}`}
                      >
                        <AlertCircle className="w-4 h-4 inline mr-2" />
                        Please fill in all required fields to continue
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                  data-testid="step-payment-details"
                >
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`space-y-5 p-6 rounded-lg ${gameBgLight} border-2 ${gameBorder}`}
                  >
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <div className={`w-1 h-6 ${gameBg} rounded-full`} />
                      Payment Details
                    </h3>
                    <div className="space-y-5">
                      <div className={`flex items-center justify-between p-5 rounded-lg bg-background border-2 ${gameBorderLight}`} data-testid="text-entry-fee-display">
                        <span className="text-base font-semibold">Entry Fee</span>
                        <span className={`text-3xl font-bold ${gameColor}`}>₹{config.entryFee}</span>
                      </div>

                      {qrCodeUrl && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 }}
                          className="text-center space-y-3"
                        >
                          <Label className="text-base font-semibold">Scan QR Code to Pay</Label>
                          <div className={`inline-block p-5 rounded-lg bg-white border-2 ${gameBorderLight}`}>
                            <img src={qrCodeUrl} alt="Payment QR Code" className="w-52 h-52 mx-auto" data-testid="img-payment-qr" />
                          </div>
                        </motion.div>
                      )}

                      <FormField
                        control={form.control}
                        name="paymentScreenshot"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-base">
                              Payment Screenshot
                              <span className="text-muted-foreground text-sm">(Optional)</span>
                              <AnimatePresence>
                                {screenshotPreview && (
                                  <motion.div variants={checkmarkVariants} initial="hidden" animate="visible" exit="hidden">
                                    <Check className={`w-4 h-4 ${gameColor}`} data-testid="check-screenshot" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </FormLabel>
                            <FormControl>
                              <div className="space-y-3">
                                {fileError && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                  >
                                    <Alert variant="destructive" data-testid="alert-file-error">
                                      <AlertCircle className="h-4 w-4" />
                                      <AlertDescription>{fileError}</AlertDescription>
                                    </Alert>
                                  </motion.div>
                                )}
                                
                                {!screenshotPreview ? (
                                  <motion.div
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                  >
                                    <div
                                      {...getRootProps()}
                                      className={`flex flex-col items-center justify-center w-full min-h-48 border-3 border-dashed rounded-lg cursor-pointer transition-all ${
                                        isDragActive
                                          ? `${gameBorder} ${gameBgLight} border-solid`
                                          : `border-border hover-elevate active-elevate-2 bg-muted/20`
                                      }`}
                                    >
                                      <input {...getInputProps()} data-testid="input-payment-screenshot" />
                                      <div className="flex flex-col items-center justify-center p-8 text-center">
                                        <motion.div
                                          animate={isDragActive ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
                                          transition={{ duration: 0.5, repeat: isDragActive ? Infinity : 0 }}
                                        >
                                          <Upload className={`w-12 h-12 mb-4 ${isDragActive ? gameColor : 'text-muted-foreground'}`} />
                                        </motion.div>
                                        <p className={`text-base font-semibold mb-2 ${isDragActive ? gameColor : 'text-foreground'}`}>
                                          {isDragActive ? "Drop your screenshot here" : "Drag & drop your payment screenshot here"}
                                        </p>
                                        <p className="text-sm text-muted-foreground mb-1">or click to browse</p>
                                        <p className="text-xs text-muted-foreground mt-2">Supported formats: PNG, JPG, JPEG, GIF, WEBP</p>
                                        <p className="text-xs text-muted-foreground">Max size: 5MB</p>
                                      </div>
                                    </div>
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-4"
                                  >
                                    <div className={`relative rounded-lg border-2 ${gameBorderLight} p-4 ${gameBgLight}`}>
                                      <img src={screenshotPreview} alt="Preview" className="w-full h-48 object-contain rounded" />
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-lg bg-background border border-border">
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <ImagePlus className={`w-5 h-5 ${gameColor} flex-shrink-0`} />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-semibold truncate" data-testid="text-file-name">{fileName}</p>
                                          <p className="text-xs text-muted-foreground" data-testid="text-file-size">{formatFileSize(fileSize)}</p>
                                        </div>
                                      </div>
                                      <div className="flex gap-2 ml-3">
                                        <div {...getRootProps()}>
                                          <input {...getInputProps()} />
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-9"
                                            data-testid="button-change-image"
                                          >
                                            Change
                                          </Button>
                                        </div>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-9"
                                          onClick={removeFile}
                                          data-testid="button-remove-image"
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </motion.div>
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
                            <FormLabel className="flex items-center gap-2 text-base">
                              Transaction ID / UTR Number
                              <span className="text-destructive">*</span>
                              <AnimatePresence>
                                {isFieldValid("transactionId") && (
                                  <motion.div variants={checkmarkVariants} initial="hidden" animate="visible" exit="hidden">
                                    <Check className={`w-4 h-4 ${gameColor}`} data-testid="check-transaction-id" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
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
                              <Input {...field} placeholder="Enter transaction ID" className="font-mono h-11" data-testid="input-transaction-id" />
                            </FormControl>
                            <FormDescription>Found in your payment app after completing payment</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </motion.div>

                  <div className="flex gap-4">
                    <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12 text-base font-semibold"
                        size="lg"
                        onClick={() => setCurrentStep(1)}
                        data-testid="button-back-step"
                      >
                        Back
                      </Button>
                    </motion.div>
                    <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="submit"
                        className={`w-full h-12 text-base font-semibold ${gameBg} hover:opacity-90`}
                        size="lg"
                        disabled={isSubmitting || !canProceedToStep3()}
                        data-testid="button-submit-registration"
                      >
                        <AnimatePresence mode="wait">
                          {isSubmitting ? (
                            <motion.div
                              key="loading"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center"
                            >
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Submitting...
                            </motion.div>
                          ) : (
                            <motion.span
                              key="submit"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              Complete Registration
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Button>
                    </motion.div>
                  </div>
                  {!canProceedToStep3() && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-sm ${gameColor} text-center p-3 rounded-md ${gameBgLight} border ${gameBorderLight}`}
                    >
                      <AlertCircle className="w-4 h-4 inline mr-2" />
                      Please enter your transaction ID to proceed
                    </motion.div>
                  )}
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center space-y-6 py-12"
                  data-testid="step-review-submit"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className={`w-16 h-16 mx-auto ${gameColor}`} />
                  </motion.div>
                  <h3 className="text-2xl font-bold">Processing Your Registration...</h3>
                  <p className="text-muted-foreground text-base">Please wait while we submit your registration</p>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
