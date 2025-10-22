import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, LogOut, Check, X, ExternalLink, RefreshCw, Users, Trophy, Download, BarChart3, CheckCircle2, Clock, XCircle, QrCode, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type Registration, TOURNAMENT_CONFIG } from "@shared/schema";
import * as XLSX from "xlsx";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [selectedGame, setSelectedGame] = useState<"bgmi" | "freefire">("bgmi");
  const [activeMode, setActiveMode] = useState<"solo" | "duo" | "squad">("solo");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrImagePreview, setQrImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  // Check authentication
  const { data: authStatus, isLoading: authLoading } = useQuery<{ authenticated: boolean }>({
    queryKey: ["/api/admin/check"],
    retry: false,
  });

  // Redirect if not authenticated (in useEffect to avoid render-time navigation)
  useEffect(() => {
    if (!authLoading && !authStatus?.authenticated) {
      setLocation("/admin/login");
    }
  }, [authLoading, authStatus, setLocation]);

  // Fetch registrations
  const { data: allRegistrations, isLoading } = useQuery<Registration[]>({
    queryKey: ["/api/registrations"],
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    enabled: !!authStatus?.authenticated,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes("Unauthorized") || error?.message?.includes("401")) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Show loading while checking auth or if not authenticated
  if (authLoading || !authStatus?.authenticated) {
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

  const filteredRegistrations = (allRegistrations || []).filter((reg) => {
    if (reg.gameType !== selectedGame) return false;
    if (reg.tournamentType !== activeMode) return false;
    if (statusFilter !== "all" && reg.status !== statusFilter) return false;
    return true;
  });

  // Update registration status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/registrations/${id}`, { status });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      toast({
        title: variables.status === "approved" ? "Registration Approved" : "Registration Rejected",
        description: variables.status === "approved" ? "Player has been notified." : "Player has been notified.",
        variant: variables.status === "rejected" ? "destructive" : "default",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update registration status.",
        variant: "destructive",
      });
    },
  });

  // Reset tournament mutation
  const resetTournamentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tournaments/reset", {
        gameType: selectedGame,
        tournamentType: activeMode,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
      toast({
        title: "Tournament Reset",
        description: "All registrations for this mode have been cleared.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reset tournament.",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/logout");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/check"] });
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
      });
      setLocation("/admin/login");
    },
  });

  // Update QR code mutation
  const updateQRMutation = useMutation({
    mutationFn: async ({ qrCodeUrl }: { qrCodeUrl: string }) => {
      const res = await apiRequest("PATCH", `/api/tournaments/${selectedGame}/${activeMode}/qr`, {
        qrCodeUrl,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      toast({
        title: "QR Code Updated",
        description: "Payment QR code has been updated successfully.",
      });
      setQrDialogOpen(false);
      setQrImagePreview(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update QR code.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleApprove = (id: string) => {
    updateStatusMutation.mutate({ id, status: "approved" });
  };

  const handleReject = (id: string) => {
    updateStatusMutation.mutate({ id, status: "rejected" });
  };

  const handleReset = () => {
    resetTournamentMutation.mutate();
  };

  const handleQRImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setQrImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveQRCode = () => {
    if (!qrImagePreview) {
      toast({
        title: "No Image",
        description: "Please upload a QR code image.",
        variant: "destructive",
      });
      return;
    }
    updateQRMutation.mutate({ qrCodeUrl: qrImagePreview });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-warning/10 text-warning hover:bg-warning/20 border-warning/20">Pending</Badge>;
      case "approved":
        return <Badge className="bg-success/10 text-success hover:bg-success/20 border-success/20">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
    }
  };

  // Export to Excel function
  const handleExportToExcel = () => {
    if (!allRegistrations || allRegistrations.length === 0) {
      toast({
        title: "No Data",
        description: "No registrations to export.",
        variant: "destructive",
      });
      return;
    }

    // Prepare data for Excel
    const exportData = filteredRegistrations.map((reg) => ({
      "Registration ID": reg.id,
      "Game": selectedGame.toUpperCase(),
      "Mode": activeMode.charAt(0).toUpperCase() + activeMode.slice(1),
      "Team Name": reg.teamName || "N/A",
      "Player 1 Name": reg.playerName,
      "Player 1 Game ID": reg.gameId,
      "WhatsApp": reg.whatsapp,
      "Player 2 Name": reg.player2Name || "N/A",
      "Player 2 Game ID": reg.player2GameId || "N/A",
      "Player 3 Name": reg.player3Name || "N/A",
      "Player 3 Game ID": reg.player3GameId || "N/A",
      "Player 4 Name": reg.player4Name || "N/A",
      "Player 4 Game ID": reg.player4GameId || "N/A",
      "Transaction ID": reg.transactionId,
      "Status": reg.status.charAt(0).toUpperCase() + reg.status.slice(1),
      "Submitted At": new Date(reg.submittedAt).toLocaleString(),
    }));

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

    // Generate filename
    const filename = `${selectedGame}_${activeMode}_registrations_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Save file
    XLSX.writeFile(workbook, filename);

    toast({
      title: "Export Successful",
      description: `Downloaded ${filteredRegistrations.length} registrations`,
    });
  };

  // Calculate statistics
  const stats = {
    total: filteredRegistrations.length,
    pending: filteredRegistrations.filter((r) => r.status === "pending").length,
    approved: filteredRegistrations.filter((r) => r.status === "approved").length,
    rejected: filteredRegistrations.filter((r) => r.status === "rejected").length,
  };

  // Show loading while fetching data
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

  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage tournament registrations and approvals</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2" data-testid="button-logout">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Game Selector */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card 
            className={`cursor-pointer transition-all hover-elevate ${selectedGame === "bgmi" ? "border-bgmi/50 bg-bgmi/5" : ""}`}
            onClick={() => setSelectedGame("bgmi")}
            data-testid="card-select-bgmi"
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-1">BGMI Tournaments</h3>
                  <p className="text-sm text-muted-foreground">Manage BGMI registrations</p>
                </div>
                <Trophy className={selectedGame === "bgmi" ? "w-8 h-8 text-bgmi" : "w-8 h-8 text-muted-foreground"} />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover-elevate ${selectedGame === "freefire" ? "border-freefire/50 bg-freefire/5" : ""}`}
            onClick={() => setSelectedGame("freefire")}
            data-testid="card-select-freefire"
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-1">Free Fire Tournaments</h3>
                  <p className="text-sm text-muted-foreground">Manage Free Fire registrations</p>
                </div>
                <Trophy className={selectedGame === "freefire" ? "w-8 h-8 text-freefire" : "w-8 h-8 text-muted-foreground"} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending</p>
                  <p className="text-3xl font-bold text-warning">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Approved</p>
                  <p className="text-3xl font-bold text-success">{stats.approved}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Rejected</p>
                  <p className="text-3xl font-bold text-destructive">{stats.rejected}</p>
                </div>
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tournament Modes */}
        <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as "solo" | "duo" | "squad")} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="solo" data-testid="tab-admin-solo">Solo</TabsTrigger>
              <TabsTrigger value="duo" data-testid="tab-admin-duo">Duo</TabsTrigger>
              <TabsTrigger value="squad" data-testid="tab-admin-squad">Squad</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-4">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="gap-2" onClick={() => setQrDialogOpen(true)} data-testid="button-manage-qr">
                <QrCode className="w-4 h-4" />
                Manage QR
              </Button>

              <Button variant="outline" className="gap-2" onClick={handleExportToExcel} data-testid="button-export-excel">
                <Download className="w-4 h-4" />
                Export Excel
              </Button>

              <Button variant="outline" className="gap-2" onClick={handleReset} data-testid="button-reset-tournament">
                <RefreshCw className="w-4 h-4" />
                Reset Tournament
              </Button>
            </div>
          </div>

          {["solo", "duo", "squad"].map((mode) => (
            <TabsContent key={mode} value={mode} className="space-y-4">
              {filteredRegistrations.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Registrations Yet</h3>
                      <p className="text-muted-foreground">
                        {statusFilter === "all" 
                          ? "No registrations found for this tournament mode."
                          : `No ${statusFilter} registrations found.`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredRegistrations.map((registration) => (
                  <Card key={registration.id} data-testid={`card-registration-${registration.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {registration.teamName || registration.playerName}
                            {getStatusBadge(registration.status)}
                          </CardTitle>
                          <CardDescription className="font-mono text-xs mt-1">
                            ID: {registration.id} • {new Date(registration.submittedAt).toLocaleString()}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Player Details */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-muted-foreground">Team Leader / Solo Player</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Name:</span>
                              <span className="font-medium">{registration.playerName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Game ID:</span>
                              <span className="font-mono text-xs">{registration.gameId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">WhatsApp:</span>
                              <span className="font-mono text-xs">{registration.whatsapp}</span>
                            </div>
                          </div>
                        </div>

                        {registration.player2Name && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-muted-foreground">Player 2</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Name:</span>
                                <span className="font-medium">{registration.player2Name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Game ID:</span>
                                <span className="font-mono text-xs">{registration.player2GameId}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Payment Info */}
                      <div className="grid md:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Transaction ID</h4>
                          <p className="font-mono text-sm">{registration.transactionId}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Payment Screenshot</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => setSelectedImage(registration.paymentScreenshot)}
                            data-testid="button-view-screenshot"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View Screenshot
                          </Button>
                        </div>
                      </div>

                      {/* Actions */}
                      {registration.status === "pending" && (
                        <div className="flex gap-3">
                          <Button
                            className="flex-1 bg-success hover:bg-success/90 text-white gap-2"
                            onClick={() => handleApprove(registration.id)}
                            data-testid="button-approve"
                          >
                            <Check className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1 gap-2"
                            onClick={() => handleReject(registration.id)}
                            data-testid="button-reject"
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Payment Screenshot Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Screenshot</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <img src={selectedImage} alt="Payment Screenshot" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Management Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Payment QR Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Upload QR code for <span className="font-semibold">{selectedGame.toUpperCase()}</span> -{" "}
                <span className="font-semibold">{activeMode.charAt(0).toUpperCase() + activeMode.slice(1)}</span> mode
              </p>
            </div>

            {/* File Upload */}
            <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleQRImageUpload}
                className="hidden"
                id="qr-upload"
                data-testid="input-qr-upload"
              />
              <label
                htmlFor="qr-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload QR code</p>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
              </label>
            </div>

            {/* Preview */}
            {qrImagePreview && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Preview:</p>
                <img
                  src={qrImagePreview}
                  alt="QR Code Preview"
                  className="w-full max-w-xs mx-auto rounded-lg border"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setQrDialogOpen(false);
                  setQrImagePreview(null);
                }}
                data-testid="button-cancel-qr"
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveQRCode}
                disabled={!qrImagePreview || updateQRMutation.isPending}
                data-testid="button-save-qr"
              >
                {updateQRMutation.isPending ? "Saving..." : "Save QR Code"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
