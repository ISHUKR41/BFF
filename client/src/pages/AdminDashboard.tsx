import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Shield, LogOut, Check, X, ExternalLink, RefreshCw, Users, Trophy, Download, BarChart3, CheckCircle2, Clock, XCircle, QrCode, Upload, DollarSign, TrendingUp, Printer, CheckCircle, Image as ImageIcon, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type Registration, type Tournament, TOURNAMENT_CONFIG } from "@shared/schema";
import { formatDistanceToNow, format, startOfDay } from "date-fns";
import * as XLSX from "xlsx";
import copy from "copy-to-clipboard";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import CountUp from "react-countup";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const ITEMS_PER_PAGE = 10;

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [selectedGame, setSelectedGame] = useState<"bgmi" | "freefire">("bgmi");
  const [activeMode, setActiveMode] = useState<"solo" | "duo" | "squad">("solo");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrImagePreview, setQrImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [approveAllDialogOpen, setApproveAllDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRegistrations, setSelectedRegistrations] = useState<Set<string>>(new Set());
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string>("");
  const { toast } = useToast();

  const { data: authStatus, isLoading: authLoading } = useQuery<{ authenticated: boolean }>({
    queryKey: ["/api/admin/check"],
    retry: false,
  });

  useEffect(() => {
    if (!authLoading && !authStatus?.authenticated) {
      setLocation("/admin/login");
    }
  }, [authLoading, authStatus, setLocation]);

  const { data: allRegistrations, isLoading } = useQuery<Registration[]>({
    queryKey: ["/api/registrations"],
    refetchInterval: 5000,
    enabled: !!authStatus?.authenticated,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes("Unauthorized") || error?.message?.includes("401")) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const { data: currentTournament } = useQuery<Tournament>({
    queryKey: ["/api/tournaments", selectedGame, activeMode],
    enabled: !!authStatus?.authenticated,
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGame, activeMode, statusFilter]);

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

  const approveAllMutation = useMutation({
    mutationFn: async () => {
      const pendingRegistrations = filteredRegistrations.filter(r => r.status === "pending");
      const results = await Promise.all(
        pendingRegistrations.map(reg => 
          apiRequest("PATCH", `/api/registrations/${reg.id}`, { status: "approved" })
            .then(res => res.json())
        )
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      toast({
        title: "All Pending Approved",
        description: `Successfully approved ${stats.pending} registrations.`,
      });
      setApproveAllDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve all registrations.",
        variant: "destructive",
      });
    },
  });

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

  const handleApproveAll = () => {
    approveAllMutation.mutate();
  };

  const handleQRImageUpload = (file: File) => {
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

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleQRImageUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleQRImageUpload(file);
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
        return <Badge className="bg-warning/10 text-warning hover:bg-warning/20 border-warning/20" data-testid="badge-status-pending">Pending</Badge>;
      case "approved":
        return <Badge className="bg-success/10 text-success hover:bg-success/20 border-success/20" data-testid="badge-status-approved">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" data-testid="badge-status-rejected">Rejected</Badge>;
    }
  };

  const handleExportToExcel = () => {
    if (!allRegistrations || allRegistrations.length === 0) {
      toast({
        title: "No Data",
        description: "No registrations to export.",
        variant: "destructive",
      });
      return;
    }

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

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

    const filename = `${selectedGame}_${activeMode}_registrations_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    XLSX.writeFile(workbook, filename);

    toast({
      title: "Export Successful",
      description: `Downloaded ${filteredRegistrations.length} registrations`,
    });
  };

  const handleExportSelected = () => {
    if (selectedRegistrations.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select registrations to export.",
        variant: "destructive",
      });
      return;
    }

    const selectedData = filteredRegistrations.filter(reg => selectedRegistrations.has(reg.id));
    
    const exportData = selectedData.map((reg) => ({
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

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Selected Registrations");

    const filename = `${selectedGame}_${activeMode}_selected_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    XLSX.writeFile(workbook, filename);

    toast({
      title: "Export Successful",
      description: `Downloaded ${selectedData.length} selected registrations`,
    });
  };

  const handlePrintView = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${selectedGame.toUpperCase()} ${activeMode} Registrations</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${selectedGame.toUpperCase()} - ${activeMode.charAt(0).toUpperCase() + activeMode.slice(1)} Registrations</h1>
          <p>Total: ${stats.total} | Pending: ${stats.pending} | Approved: ${stats.approved} | Rejected: ${stats.rejected}</p>
          <table>
            <thead>
              <tr>
                <th>Team Name</th>
                <th>Player Name</th>
                <th>Game ID</th>
                <th>WhatsApp</th>
                <th>Transaction ID</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRegistrations.map(reg => `
                <tr>
                  <td>${reg.teamName || 'N/A'}</td>
                  <td>${reg.playerName}</td>
                  <td>${reg.gameId}</td>
                  <td>${reg.whatsapp}</td>
                  <td>${reg.transactionId}</td>
                  <td>${reg.status}</td>
                  <td>${new Date(reg.submittedAt).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; cursor: pointer;">Print</button>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const toggleRegistrationSelection = (id: string) => {
    const newSelection = new Set(selectedRegistrations);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedRegistrations(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedRegistrations.size === paginatedRegistrations.length) {
      setSelectedRegistrations(new Set());
    } else {
      setSelectedRegistrations(new Set(paginatedRegistrations.map(r => r.id)));
    }
  };

  const getPlayerInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCopy = (text: string, label: string) => {
    copy(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const handleViewImage = (imageUrl: string) => {
    setLightboxImage(imageUrl);
    setLightboxOpen(true);
  };

  // Early return for auth check
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

  // Calculate filtered registrations and stats
  const filteredRegistrations = (allRegistrations || []).filter((reg) => {
    if (reg.gameType !== selectedGame) return false;
    if (reg.tournamentType !== activeMode) return false;
    if (statusFilter !== "all" && reg.status !== statusFilter) return false;
    return true;
  });

  const comprehensiveStats = {
    totalRegistrations: allRegistrations?.length || 0,
    totalRevenue: allRegistrations?.reduce((sum, reg) => {
      if (reg.status === "approved") {
        const config = TOURNAMENT_CONFIG[reg.gameType as keyof typeof TOURNAMENT_CONFIG][reg.tournamentType as keyof typeof TOURNAMENT_CONFIG.bgmi];
        return sum + config.entryFee;
      }
      return sum;
    }, 0) || 0,
    totalPending: allRegistrations?.filter(r => r.status === "pending").length || 0,
    totalApproved: allRegistrations?.filter(r => r.status === "approved").length || 0,
    approvalRate: allRegistrations && allRegistrations.length > 0 
      ? Math.round((allRegistrations.filter(r => r.status === "approved").length / allRegistrations.length) * 100)
      : 0,
  };

  // Chart data calculations
  const gameTypeData = [
    {
      name: "BGMI",
      registrations: allRegistrations?.filter(r => r.gameType === "bgmi").length || 0,
      approved: allRegistrations?.filter(r => r.gameType === "bgmi" && r.status === "approved").length || 0,
      pending: allRegistrations?.filter(r => r.gameType === "bgmi" && r.status === "pending").length || 0,
      rejected: allRegistrations?.filter(r => r.gameType === "bgmi" && r.status === "rejected").length || 0,
    },
    {
      name: "Free Fire",
      registrations: allRegistrations?.filter(r => r.gameType === "freefire").length || 0,
      approved: allRegistrations?.filter(r => r.gameType === "freefire" && r.status === "approved").length || 0,
      pending: allRegistrations?.filter(r => r.gameType === "freefire" && r.status === "pending").length || 0,
      rejected: allRegistrations?.filter(r => r.gameType === "freefire" && r.status === "rejected").length || 0,
    },
  ];

  const modeData = [
    {
      name: "Solo",
      registrations: allRegistrations?.filter(r => r.tournamentType === "solo").length || 0,
      approved: allRegistrations?.filter(r => r.tournamentType === "solo" && r.status === "approved").length || 0,
    },
    {
      name: "Duo",
      registrations: allRegistrations?.filter(r => r.tournamentType === "duo").length || 0,
      approved: allRegistrations?.filter(r => r.tournamentType === "duo" && r.status === "approved").length || 0,
    },
    {
      name: "Squad",
      registrations: allRegistrations?.filter(r => r.tournamentType === "squad").length || 0,
      approved: allRegistrations?.filter(r => r.tournamentType === "squad" && r.status === "approved").length || 0,
    },
  ];

  const revenueData = [
    {
      name: "BGMI Solo",
      revenue: allRegistrations?.filter(r => r.gameType === "bgmi" && r.tournamentType === "solo" && r.status === "approved").length * TOURNAMENT_CONFIG.bgmi.solo.entryFee || 0,
    },
    {
      name: "BGMI Duo",
      revenue: allRegistrations?.filter(r => r.gameType === "bgmi" && r.tournamentType === "duo" && r.status === "approved").length * TOURNAMENT_CONFIG.bgmi.duo.entryFee || 0,
    },
    {
      name: "BGMI Squad",
      revenue: allRegistrations?.filter(r => r.gameType === "bgmi" && r.tournamentType === "squad" && r.status === "approved").length * TOURNAMENT_CONFIG.bgmi.squad.entryFee || 0,
    },
    {
      name: "FF Solo",
      revenue: allRegistrations?.filter(r => r.gameType === "freefire" && r.tournamentType === "solo" && r.status === "approved").length * TOURNAMENT_CONFIG.freefire.solo.entryFee || 0,
    },
    {
      name: "FF Duo",
      revenue: allRegistrations?.filter(r => r.gameType === "freefire" && r.tournamentType === "duo" && r.status === "approved").length * TOURNAMENT_CONFIG.freefire.duo.entryFee || 0,
    },
    {
      name: "FF Squad",
      revenue: allRegistrations?.filter(r => r.gameType === "freefire" && r.tournamentType === "squad" && r.status === "approved").length * TOURNAMENT_CONFIG.freefire.squad.entryFee || 0,
    },
  ].filter(item => item.revenue > 0);

  // Registration trends over time (group by day)
  const trendData = allRegistrations?.reduce((acc: any[], reg) => {
    const date = format(startOfDay(new Date(reg.submittedAt)), "MMM dd");
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.registrations += 1;
      if (reg.status === "approved") existing.approved += 1;
    } else {
      acc.push({
        date,
        registrations: 1,
        approved: reg.status === "approved" ? 1 : 0,
      });
    }
    return acc;
  }, []).slice(-7) || []; // Last 7 days

  const COLORS = {
    bgmi: "hsl(var(--bgmi))",
    freefire: "hsl(var(--freefire))",
    primary: "hsl(var(--primary))",
    success: "hsl(var(--success))",
    warning: "hsl(var(--warning))",
    destructive: "hsl(var(--destructive))",
  };

  const stats = {
    total: filteredRegistrations.length,
    pending: filteredRegistrations.filter((r) => r.status === "pending").length,
    approved: filteredRegistrations.filter((r) => r.status === "approved").length,
    rejected: filteredRegistrations.filter((r) => r.status === "rejected").length,
  };

  const totalPages = Math.ceil(filteredRegistrations.length / ITEMS_PER_PAGE);
  const paginatedRegistrations = filteredRegistrations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" data-testid="icon-admin-shield" />
            <div>
              <h1 className="text-4xl font-bold tracking-tight" data-testid="text-admin-title">Admin Dashboard</h1>
              <p className="text-muted-foreground" data-testid="text-admin-subtitle">Manage tournament registrations and approvals</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2" data-testid="button-logout">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0 }}
          >
            <Card data-testid="card-stat-total" className="hover-elevate">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Registrations</p>
                    <p className="text-3xl font-bold" data-testid="text-total-registrations">
                      <CountUp end={comprehensiveStats.totalRegistrations} duration={2} />
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">All games & modes</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card data-testid="card-stat-revenue" className="hover-elevate">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold" data-testid="text-total-revenue">
                      ₹<CountUp end={comprehensiveStats.totalRevenue} duration={2} />
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">From approved entries</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card data-testid="card-stat-pending" className="hover-elevate">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Pending Approvals</p>
                    <div className="flex items-center gap-2">
                      <p className="text-3xl font-bold text-warning" data-testid="text-total-pending">
                        <CountUp end={comprehensiveStats.totalPending} duration={2} />
                      </p>
                      {comprehensiveStats.totalPending > 0 && (
                        <div className="w-2 h-2 rounded-full bg-warning animate-pulse" data-testid="indicator-pending-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Requires action</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card data-testid="card-stat-approval-rate" className="hover-elevate">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Approval Rate</p>
                    <p className="text-3xl font-bold text-success" data-testid="text-approval-rate">
                      <CountUp end={comprehensiveStats.approvalRate} duration={2} />%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{comprehensiveStats.totalApproved} approved</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="mb-8" data-testid="card-data-visualization">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Data Visualization & Analytics
              </CardTitle>
              <CardDescription>Comprehensive insights into tournament registrations and revenue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  data-testid="chart-game-type"
                >
                  <h3 className="text-sm font-semibold mb-4">Registrations by Game Type</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={gameTypeData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="approved" fill={COLORS.success} name="Approved" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pending" fill={COLORS.warning} name="Pending" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="rejected" fill={COLORS.destructive} name="Rejected" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  data-testid="chart-tournament-mode"
                >
                  <h3 className="text-sm font-semibold mb-4">Registrations by Tournament Mode</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={modeData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="registrations" fill={COLORS.primary} name="Total" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="approved" fill={COLORS.success} name="Approved" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>

                {trendData.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    data-testid="chart-registration-trends"
                  >
                    <h3 className="text-sm font-semibold mb-4">Registration Trends (Last 7 Days)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="date" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="registrations"
                          stroke={COLORS.primary}
                          strokeWidth={2}
                          name="Total Registrations"
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="approved"
                          stroke={COLORS.success}
                          strokeWidth={2}
                          name="Approved"
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}

                {revenueData.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    data-testid="chart-revenue-distribution"
                  >
                    <h3 className="text-sm font-semibold mb-4">Revenue Distribution (₹)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="name" fontSize={12} angle={-15} textAnchor="end" height={60} />
                        <YAxis fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                          }}
                          formatter={(value: any) => `₹${value}`}
                        />
                        <Bar dataKey="revenue" fill={COLORS.success} name="Revenue" radius={[4, 4, 0, 0]}>
                          {revenueData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.name.startsWith("BGMI") ? COLORS.bgmi : COLORS.freefire}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

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

        <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as "solo" | "duo" | "squad")} className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <TabsList data-testid="tabs-tournament-mode">
              <TabsTrigger value="solo" data-testid="tab-admin-solo">Solo</TabsTrigger>
              <TabsTrigger value="duo" data-testid="tab-admin-duo">Duo</TabsTrigger>
              <TabsTrigger value="squad" data-testid="tab-admin-squad">Squad</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2 flex-wrap">
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
            </div>
          </div>

          <Card data-testid="card-quick-actions">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Perform bulk operations on registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="default" 
                  className="gap-2" 
                  onClick={() => setApproveAllDialogOpen(true)}
                  disabled={stats.pending === 0 || approveAllMutation.isPending}
                  data-testid="button-approve-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve All Pending ({stats.pending})
                </Button>

                <Button 
                  variant="outline" 
                  className="gap-2" 
                  onClick={handleExportSelected}
                  disabled={selectedRegistrations.size === 0}
                  data-testid="button-export-selected"
                >
                  <Download className="w-4 h-4" />
                  Export Selected ({selectedRegistrations.size})
                </Button>

                <Button 
                  variant="outline" 
                  className="gap-2" 
                  onClick={handlePrintView}
                  disabled={filteredRegistrations.length === 0}
                  data-testid="button-print-view"
                >
                  <Printer className="w-4 h-4" />
                  Print-Friendly View
                </Button>

                <Button 
                  variant="outline" 
                  className="gap-2" 
                  onClick={() => setQrDialogOpen(true)} 
                  data-testid="button-manage-qr"
                >
                  <QrCode className="w-4 h-4" />
                  Manage QR Code
                </Button>

                <Button 
                  variant="outline" 
                  className="gap-2" 
                  onClick={handleExportToExcel} 
                  data-testid="button-export-excel"
                >
                  <Download className="w-4 h-4" />
                  Export All
                </Button>

                <Button 
                  variant="outline" 
                  className="gap-2" 
                  onClick={handleReset} 
                  data-testid="button-reset-tournament"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset Tournament
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card data-testid="card-filtered-total">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total</p>
                    <p className="text-3xl font-bold" data-testid="text-filtered-total">{stats.total}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-filtered-pending">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Pending</p>
                    <p className="text-3xl font-bold text-warning" data-testid="text-filtered-pending">{stats.pending}</p>
                  </div>
                  <Clock className="w-8 h-8 text-warning" />
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-filtered-approved">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Approved</p>
                    <p className="text-3xl font-bold text-success" data-testid="text-filtered-approved">{stats.approved}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-filtered-rejected">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Rejected</p>
                    <p className="text-3xl font-bold text-destructive" data-testid="text-filtered-rejected">{stats.rejected}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
          </div>

          {["solo", "duo", "squad"].map((mode) => (
            <TabsContent key={mode} value={mode} className="space-y-4">
              {filteredRegistrations.length === 0 ? (
                <Card data-testid="card-no-registrations">
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
                <>
                  {paginatedRegistrations.length > 0 && (
                    <div className="flex items-center gap-2 px-2">
                      <input
                        type="checkbox"
                        checked={selectedRegistrations.size === paginatedRegistrations.length && paginatedRegistrations.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 cursor-pointer"
                        data-testid="checkbox-select-all"
                      />
                      <label className="text-sm text-muted-foreground cursor-pointer" onClick={toggleSelectAll}>
                        Select all on this page
                      </label>
                    </div>
                  )}

                  {paginatedRegistrations.map((registration) => (
                    <Card key={registration.id} data-testid={`card-registration-${registration.id}`} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex items-start gap-3 flex-1">
                            <input
                              type="checkbox"
                              checked={selectedRegistrations.has(registration.id)}
                              onChange={() => toggleRegistrationSelection(registration.id)}
                              className="mt-1 w-4 h-4 cursor-pointer"
                              data-testid={`checkbox-registration-${registration.id}`}
                            />
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {getPlayerInitials(registration.playerName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <CardTitle className="flex items-center gap-2 flex-wrap">
                                <span data-testid={`text-team-name-${registration.id}`}>
                                  {registration.teamName || registration.playerName}
                                </span>
                                {getStatusBadge(registration.status)}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                <span className="text-xs text-muted-foreground" data-testid={`text-submitted-time-${registration.id}`}>
                                  {formatDistanceToNow(new Date(registration.submittedAt), { addSuffix: true })}
                                </span>
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {registration.status === "pending" && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="default" 
                                  className="gap-2" 
                                  onClick={() => handleApprove(registration.id)}
                                  disabled={updateStatusMutation.isPending}
                                  data-testid={`button-approve-${registration.id}`}
                                >
                                  <Check className="w-4 h-4" />
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive" 
                                  className="gap-2" 
                                  onClick={() => handleReject(registration.id)}
                                  disabled={updateStatusMutation.isPending}
                                  data-testid={`button-reject-${registration.id}`}
                                >
                                  <X className="w-4 h-4" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <Separator />

                      <CardContent className="pt-4 space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Team Leader / Solo Player
                          </h4>
                          <div className="grid md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Player Name</p>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-xs bg-muted">
                                    {getPlayerInitials(registration.playerName)}
                                  </AvatarFallback>
                                </Avatar>
                                <p className="font-medium" data-testid={`text-player-name-${registration.id}`}>{registration.playerName}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Game ID</p>
                              <p className="font-mono text-sm" data-testid={`text-game-id-${registration.id}`}>{registration.gameId}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">WhatsApp</p>
                              <p className="font-mono text-sm" data-testid={`text-whatsapp-${registration.id}`}>{registration.whatsapp}</p>
                            </div>
                          </div>
                        </div>

                        {(registration.player2Name || registration.player3Name || registration.player4Name) && (
                          <>
                            <Separator />
                            <div>
                              <h4 className="text-sm font-semibold mb-3">Team Members</h4>
                              <div className="space-y-3">
                                {registration.player2Name && (
                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Player 2 Name</p>
                                      <div className="flex items-center gap-2">
                                        <Avatar className="w-6 h-6">
                                          <AvatarFallback className="text-xs bg-muted">
                                            {getPlayerInitials(registration.player2Name)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <p className="font-medium" data-testid={`text-player2-name-${registration.id}`}>{registration.player2Name}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Game ID</p>
                                      <p className="font-mono text-sm" data-testid={`text-player2-id-${registration.id}`}>{registration.player2GameId}</p>
                                    </div>
                                  </div>
                                )}
                                {registration.player3Name && (
                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Player 3 Name</p>
                                      <div className="flex items-center gap-2">
                                        <Avatar className="w-6 h-6">
                                          <AvatarFallback className="text-xs bg-muted">
                                            {getPlayerInitials(registration.player3Name)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <p className="font-medium" data-testid={`text-player3-name-${registration.id}`}>{registration.player3Name}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Game ID</p>
                                      <p className="font-mono text-sm" data-testid={`text-player3-id-${registration.id}`}>{registration.player3GameId}</p>
                                    </div>
                                  </div>
                                )}
                                {registration.player4Name && (
                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Player 4 Name</p>
                                      <div className="flex items-center gap-2">
                                        <Avatar className="w-6 h-6">
                                          <AvatarFallback className="text-xs bg-muted">
                                            {getPlayerInitials(registration.player4Name)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <p className="font-medium" data-testid={`text-player4-name-${registration.id}`}>{registration.player4Name}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Game ID</p>
                                      <p className="font-mono text-sm" data-testid={`text-player4-id-${registration.id}`}>{registration.player4GameId}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}

                        <Separator />
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Payment Information
                          </h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Transaction ID</p>
                              <div className="flex items-center gap-2">
                                <p className="font-mono text-sm font-semibold text-primary flex-1" data-testid={`text-transaction-id-${registration.id}`}>
                                  {registration.transactionId}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCopy(registration.transactionId, "Transaction ID")}
                                  data-testid={`button-copy-transaction-${registration.id}`}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            {registration.paymentScreenshot && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Payment Screenshot</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2"
                                  onClick={() => handleViewImage(registration.paymentScreenshot || "")}
                                  data-testid={`button-view-screenshot-${registration.id}`}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  View Screenshot
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        data-testid="button-prev-page"
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-10"
                            data-testid={`button-page-${page}`}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        data-testid="button-next-page"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>

        <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
          <DialogContent className="sm:max-w-md" data-testid="dialog-qr-management">
            <DialogHeader>
              <DialogTitle>Manage QR Code</DialogTitle>
              <DialogDescription>
                Upload a new payment QR code for {selectedGame.toUpperCase()} {activeMode} tournament
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {currentTournament?.qrCodeUrl && !qrImagePreview && (
                <div>
                  <p className="text-sm font-medium mb-2">Current QR Code</p>
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <img 
                      src={currentTournament.qrCodeUrl} 
                      alt="Current QR Code" 
                      className="w-full max-w-xs mx-auto rounded"
                      data-testid="img-current-qr"
                    />
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2">Upload New QR Code</p>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging 
                      ? "border-primary bg-primary/10" 
                      : "border-muted-foreground/25 hover:border-primary/50"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  data-testid="dropzone-qr-upload"
                >
                  {qrImagePreview ? (
                    <div className="space-y-3">
                      <img 
                        src={qrImagePreview} 
                        alt="QR Preview" 
                        className="w-full max-w-xs mx-auto rounded"
                        data-testid="img-qr-preview"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQrImagePreview(null)}
                        data-testid="button-remove-qr-preview"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-8 h-8 text-primary" />
                      </div>
                      <p className="text-sm font-medium mb-1">
                        Drag and drop your QR code here
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">
                        or click to browse files
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileInputChange}
                        className="hidden"
                        id="qr-upload"
                        data-testid="input-qr-file"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('qr-upload')?.click()}
                        className="gap-2"
                        data-testid="button-browse-qr"
                      >
                        <ImageIcon className="w-4 h-4" />
                        Browse Files
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setQrDialogOpen(false);
                    setQrImagePreview(null);
                  }}
                  data-testid="button-cancel-qr"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveQRCode}
                  disabled={!qrImagePreview || updateQRMutation.isPending}
                  data-testid="button-save-qr"
                >
                  {updateQRMutation.isPending ? "Uploading..." : "Save QR Code"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={approveAllDialogOpen} onOpenChange={setApproveAllDialogOpen}>
          <AlertDialogContent data-testid="dialog-approve-all-confirm">
            <AlertDialogHeader>
              <AlertDialogTitle>Approve All Pending Registrations?</AlertDialogTitle>
              <AlertDialogDescription>
                This will approve {stats.pending} pending registration{stats.pending !== 1 ? 's' : ''} for {selectedGame.toUpperCase()} {activeMode} tournament. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-approve-all">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleApproveAll}
                disabled={approveAllMutation.isPending}
                data-testid="button-confirm-approve-all"
              >
                {approveAllMutation.isPending ? "Approving..." : "Approve All"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={[{ src: lightboxImage }]}
        />
      </div>
    </div>
  );
}
