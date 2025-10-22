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
import { Shield, LogOut, Check, X, ExternalLink, RefreshCw, Users, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type Registration } from "@shared/schema";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [selectedGame, setSelectedGame] = useState<"bgmi" | "freefire">("bgmi");
  const [activeMode, setActiveMode] = useState<"solo" | "duo" | "squad">("solo");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { toast } = useToast();

  // Check authentication
  const { data: authStatus, isLoading: authLoading } = useQuery({
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
      return await apiRequest(`/api/registrations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
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
      return await apiRequest("/api/tournaments/reset", {
        method: "POST",
        body: JSON.stringify({ gameType: selectedGame, tournamentType: activeMode }),
      });
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
      return await apiRequest("/api/admin/logout", {
        method: "POST",
      });
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

      {/* Image Dialog */}
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
    </div>
  );
}
