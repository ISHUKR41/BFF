import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, LogOut, Check, X, ExternalLink, RefreshCw, Users, Trophy, Download, BarChart3, 
  CheckCircle2, Clock, XCircle, QrCode, Upload, DollarSign, TrendingUp, Printer, 
  CheckCircle, Image as ImageIcon, Copy, Search, Flag, Edit, Trash2, FileText,
  MessageSquare, PhoneCall, Gamepad2, Filter, Calendar, AlertTriangle, BadgeCheck,
  Activity, StickyNote, Eye, MoreVertical, ArrowUpDown, FileSpreadsheet, UserCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type Registration, type Tournament, type ActivityLog, TOURNAMENT_CONFIG } from "@shared/schema";
import { formatDistanceToNow, format, startOfDay, subDays, isAfter, isBefore, parseISO } from "date-fns";
import * as XLSX from "xlsx";
import copy from "copy-to-clipboard";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import CountUp from "react-countup";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";

const ITEMS_PER_PAGE = 10;

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [selectedGame, setSelectedGame] = useState<"bgmi" | "freefire">("bgmi");
  const [activeMode, setActiveMode] = useState<"solo" | "duo" | "squad">("solo");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [flagFilter, setFlagFilter] = useState<"all" | "flagged" | "unflagged">("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "verified" | "unverified">("all");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrImagePreview, setQrImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [approveAllDialogOpen, setApproveAllDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRegistrations, setSelectedRegistrations] = useState<Set<string>>(new Set());
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string>("");
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [currentNotes, setCurrentNotes] = useState("");
  const [currentNotesId, setCurrentNotesId] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState<Registration | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [activityLogDialogOpen, setActivityLogDialogOpen] = useState(false);
  const [activityTarget, setActivityTarget] = useState<{type: string, id: string}>({type: "", id: ""});
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  
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

  const { data: activityLogs } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs"],
    enabled: !!authStatus?.authenticated && activityLogDialogOpen,
  });

  const { data: targetActivityLogs, isError: targetLogsError } = useQuery<ActivityLog[]>({
    queryKey: [`/api/activity-logs/${activityTarget.type}/${activityTarget.id}`],
    enabled: !!authStatus?.authenticated && !!activityTarget.type && !!activityTarget.id,
    retry: false,
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGame, activeMode, statusFilter, searchQuery, dateFilter, flagFilter, paymentFilter]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/registrations/${id}`, { status });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && key.startsWith("/api/activity-logs");
        }
      });
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

  const flagMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/registrations/${id}/flag`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && key.startsWith("/api/activity-logs");
        }
      });
      toast({
        title: "Flag Toggled",
        description: "Registration flag status updated.",
      });
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/registrations/${id}/verify-payment`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && key.startsWith("/api/activity-logs");
        }
      });
      toast({
        title: "Payment Verification Toggled",
        description: "Payment verification status updated.",
      });
    },
  });

  const notesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const res = await apiRequest("PATCH", `/api/registrations/${id}/notes`, { notes });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && key.startsWith("/api/activity-logs");
        }
      });
      setNotesDialogOpen(false);
      toast({
        title: "Notes Updated",
        description: "Admin notes have been saved.",
      });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Registration> }) => {
      const res = await apiRequest("PUT", `/api/registrations/${id}/details`, updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && key.startsWith("/api/activity-logs");
        }
      });
      setEditDialogOpen(false);
      setEditingRegistration(null);
      toast({
        title: "Registration Updated",
        description: "Registration details have been updated.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/registrations/${id}`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && key.startsWith("/api/activity-logs");
        }
      });
      setDeleteDialogOpen(false);
      toast({
        title: "Registration Deleted",
        description: "Registration has been permanently deleted.",
      });
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await apiRequest("POST", "/api/registrations/bulk/approve", { ids });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && key.startsWith("/api/activity-logs");
        }
      });
      setSelectedRegistrations(new Set());
      toast({
        title: "Bulk Approve Successful",
        description: `Approved ${data.count} registrations.`,
      });
    },
  });

  const bulkRejectMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await apiRequest("POST", "/api/registrations/bulk/reject", { ids });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && key.startsWith("/api/activity-logs");
        }
      });
      setSelectedRegistrations(new Set());
      toast({
        title: "Bulk Reject Successful",
        description: `Rejected ${data.count} registrations.`,
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await apiRequest("POST", "/api/registrations/bulk/delete", { ids });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && key.startsWith("/api/activity-logs");
        }
      });
      setSelectedRegistrations(new Set());
      setBulkDeleteDialogOpen(false);
      toast({
        title: "Bulk Delete Successful",
        description: `Deleted ${data.count} registrations.`,
      });
    },
  });

  const approveAllMutation = useMutation({
    mutationFn: async () => {
      const pendingRegistrations = filteredRegistrations.filter(r => r.status === "pending");
      const res = await apiRequest("POST", "/api/registrations/bulk/approve", { 
        ids: pendingRegistrations.map(r => r.id) 
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && key.startsWith("/api/activity-logs");
        }
      });
      toast({
        title: "All Pending Approved",
        description: `Successfully approved ${data.count} registrations.`,
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
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && key.startsWith("/api/activity-logs");
        }
      });
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

  const handleFlag = (id: string) => {
    flagMutation.mutate(id);
  };

  const handleVerifyPayment = (id: string) => {
    verifyPaymentMutation.mutate(id);
  };

  const handleOpenNotes = (registration: Registration) => {
    setCurrentNotesId(registration.id);
    setCurrentNotes(registration.adminNotes || "");
    setNotesDialogOpen(true);
  };

  const handleSaveNotes = () => {
    notesMutation.mutate({ id: currentNotesId, notes: currentNotes });
  };

  const handleOpenEdit = (registration: Registration) => {
    setEditingRegistration(registration);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingRegistration) return;
    
    const { id, submittedAt, lastModifiedAt, lastModifiedBy, ...updates } = editingRegistration;
    editMutation.mutate({ id, updates });
  };

  const handleOpenDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(deletingId);
  };

  const handleBulkApprove = () => {
    const ids = Array.from(selectedRegistrations);
    bulkApproveMutation.mutate(ids);
  };

  const handleBulkReject = () => {
    const ids = Array.from(selectedRegistrations);
    bulkRejectMutation.mutate(ids);
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedRegistrations);
    bulkDeleteMutation.mutate(ids);
  };

  const handleViewActivityLog = (registration: Registration) => {
    setActivityTarget({ type: "registration", id: registration.id });
    setActivityLogDialogOpen(true);
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
      "Payment Verified": reg.paymentVerified === 1 ? "Yes" : "No",
      "Flagged": reg.isFlagged === 1 ? "Yes" : "No",
      "Admin Notes": reg.adminNotes || "N/A",
      "Status": reg.status.charAt(0).toUpperCase() + reg.status.slice(1),
      "Submitted At": new Date(reg.submittedAt).toLocaleString(),
      "Last Modified": reg.lastModifiedAt ? new Date(reg.lastModifiedAt).toLocaleString() : "N/A",
      "Modified By": reg.lastModifiedBy || "N/A",
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

  const handleExportWhatsAppNumbers = () => {
    if (filteredRegistrations.length === 0) {
      toast({
        title: "No Data",
        description: "No registrations to export.",
        variant: "destructive",
      });
      return;
    }

    const whatsappNumbers = filteredRegistrations.map(reg => reg.whatsapp).join("\n");
    copy(whatsappNumbers);
    
    toast({
      title: "Copied!",
      description: `${filteredRegistrations.length} WhatsApp numbers copied to clipboard.`,
    });
  };

  const handleExportGameIDs = () => {
    if (filteredRegistrations.length === 0) {
      toast({
        title: "No Data",
        description: "No registrations to export.",
        variant: "destructive",
      });
      return;
    }

    const gameIDs: string[] = [];
    filteredRegistrations.forEach(reg => {
      gameIDs.push(`${reg.playerName}: ${reg.gameId}`);
      if (reg.player2GameId) gameIDs.push(`${reg.player2Name}: ${reg.player2GameId}`);
      if (reg.player3GameId) gameIDs.push(`${reg.player3Name}: ${reg.player3GameId}`);
      if (reg.player4GameId) gameIDs.push(`${reg.player4Name}: ${reg.player4GameId}`);
    });
    
    copy(gameIDs.join("\n"));
    
    toast({
      title: "Copied!",
      description: `${gameIDs.length} Game IDs copied to clipboard.`,
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
      "Payment Verified": reg.paymentVerified === 1 ? "Yes" : "No",
      "Flagged": reg.isFlagged === 1 ? "Yes" : "No",
      "Admin Notes": reg.adminNotes || "N/A",
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
  let filteredRegistrations = (allRegistrations || []).filter((reg) => {
    if (reg.gameType !== selectedGame) return false;
    if (reg.tournamentType !== activeMode) return false;
    if (statusFilter !== "all" && reg.status !== statusFilter) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        reg.playerName.toLowerCase().includes(query) ||
        reg.gameId.toLowerCase().includes(query) ||
        reg.whatsapp.includes(query) ||
        reg.transactionId.toLowerCase().includes(query) ||
        (reg.teamName && reg.teamName.toLowerCase().includes(query)) ||
        (reg.player2Name && reg.player2Name.toLowerCase().includes(query)) ||
        (reg.player3Name && reg.player3Name.toLowerCase().includes(query)) ||
        (reg.player4Name && reg.player4Name.toLowerCase().includes(query)) ||
        (reg.adminNotes && reg.adminNotes.toLowerCase().includes(query));
      
      if (!matchesSearch) return false;
    }
    
    // Date filter
    if (dateFilter !== "all") {
      const regDate = new Date(reg.submittedAt);
      const now = new Date();
      if (dateFilter === "today") {
        if (format(regDate, "yyyy-MM-dd") !== format(now, "yyyy-MM-dd")) return false;
      } else if (dateFilter === "week") {
        if (isBefore(regDate, subDays(now, 7))) return false;
      } else if (dateFilter === "month") {
        if (isBefore(regDate, subDays(now, 30))) return false;
      }
    }
    
    // Flag filter
    if (flagFilter !== "all") {
      if (flagFilter === "flagged" && reg.isFlagged !== 1) return false;
      if (flagFilter === "unflagged" && reg.isFlagged !== 0) return false;
    }
    
    // Payment filter
    if (paymentFilter !== "all") {
      if (paymentFilter === "verified" && reg.paymentVerified !== 1) return false;
      if (paymentFilter === "unverified" && reg.paymentVerified !== 0) return false;
    }
    
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
    totalFlagged: allRegistrations?.filter(r => r.isFlagged === 1).length || 0,
    totalVerified: allRegistrations?.filter(r => r.paymentVerified === 1).length || 0,
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
      revenue: (allRegistrations?.filter(r => r.gameType === "bgmi" && r.tournamentType === "solo" && r.status === "approved").length || 0) * TOURNAMENT_CONFIG.bgmi.solo.entryFee,
    },
    {
      name: "BGMI Duo",
      revenue: (allRegistrations?.filter(r => r.gameType === "bgmi" && r.tournamentType === "duo" && r.status === "approved").length || 0) * TOURNAMENT_CONFIG.bgmi.duo.entryFee,
    },
    {
      name: "BGMI Squad",
      revenue: (allRegistrations?.filter(r => r.gameType === "bgmi" && r.tournamentType === "squad" && r.status === "approved").length || 0) * TOURNAMENT_CONFIG.bgmi.squad.entryFee,
    },
    {
      name: "FF Solo",
      revenue: (allRegistrations?.filter(r => r.gameType === "freefire" && r.tournamentType === "solo" && r.status === "approved").length || 0) * TOURNAMENT_CONFIG.freefire.solo.entryFee,
    },
    {
      name: "FF Duo",
      revenue: (allRegistrations?.filter(r => r.gameType === "freefire" && r.tournamentType === "duo" && r.status === "approved").length || 0) * TOURNAMENT_CONFIG.freefire.duo.entryFee,
    },
    {
      name: "FF Squad",
      revenue: (allRegistrations?.filter(r => r.gameType === "freefire" && r.tournamentType === "squad" && r.status === "approved").length || 0) * TOURNAMENT_CONFIG.freefire.squad.entryFee,
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
      <div className="max-w-[1800px] mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-10 h-10 text-primary" />
              <div>
                <h1 className="text-4xl font-bold" data-testid="heading-admin-dashboard">Advanced Admin Dashboard</h1>
                <p className="text-muted-foreground">Complete tournament management and analytics</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setActivityLogDialogOpen(true)}
              data-testid="button-view-activity-log"
            >
              <Activity className="w-4 h-4" />
              Activity Log
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </motion.div>

        {/* Advanced Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8"
        >
          <Card data-testid="card-total-registrations">
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground mb-1">Total</p>
                <p className="text-2xl font-bold">
                  <CountUp end={comprehensiveStats.totalRegistrations} duration={1} />
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-total-revenue">
            <CardContent className="pt-6">
              <div className="text-center">
                <DollarSign className="w-6 h-6 mx-auto mb-2 text-success" />
                <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                <p className="text-2xl font-bold text-success">
                  ₹<CountUp end={comprehensiveStats.totalRevenue} duration={1} />
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-total-pending">
            <CardContent className="pt-6">
              <div className="text-center">
                <Clock className="w-6 h-6 mx-auto mb-2 text-warning" />
                <p className="text-xs text-muted-foreground mb-1">Pending</p>
                <p className="text-2xl font-bold text-warning">
                  <CountUp end={comprehensiveStats.totalPending} duration={1} />
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-total-approved">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-success" />
                <p className="text-xs text-muted-foreground mb-1">Approved</p>
                <p className="text-2xl font-bold text-success">
                  <CountUp end={comprehensiveStats.totalApproved} duration={1} />
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-approval-rate">
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground mb-1">Rate</p>
                <p className="text-2xl font-bold">
                  <CountUp end={comprehensiveStats.approvalRate} duration={1} />%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-total-flagged">
            <CardContent className="pt-6">
              <div className="text-center">
                <Flag className="w-6 h-6 mx-auto mb-2 text-destructive" />
                <p className="text-xs text-muted-foreground mb-1">Flagged</p>
                <p className="text-2xl font-bold text-destructive">
                  <CountUp end={comprehensiveStats.totalFlagged} duration={1} />
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-total-verified">
            <CardContent className="pt-6">
              <div className="text-center">
                <UserCheck className="w-6 h-6 mx-auto mb-2 text-success" />
                <p className="text-xs text-muted-foreground mb-1">Verified</p>
                <p className="text-2xl font-bold">
                  <CountUp end={comprehensiveStats.totalVerified} duration={1} />
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Advanced Analytics Charts - Collapsible */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Button
            variant="outline"
            className="w-full mb-4 gap-2"
            onClick={() => setShowAdvancedStats(!showAdvancedStats)}
            data-testid="button-toggle-analytics"
          >
            <BarChart3 className="w-4 h-4" />
            {showAdvancedStats ? "Hide" : "Show"} Advanced Analytics
            <ArrowUpDown className="w-4 h-4 ml-auto" />
          </Button>

          {showAdvancedStats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Game Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Game Distribution
                  </CardTitle>
                  <CardDescription>Registration breakdown by game type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={gameTypeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="approved" fill={COLORS.success} name="Approved" />
                      <Bar dataKey="pending" fill={COLORS.warning} name="Pending" />
                      <Bar dataKey="rejected" fill={COLORS.destructive} name="Rejected" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Mode Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Mode Distribution
                  </CardTitle>
                  <CardDescription>Registrations by tournament mode</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={modeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="registrations" fill={COLORS.primary} name="Total" />
                      <Bar dataKey="approved" fill={COLORS.success} name="Approved" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Revenue Chart */}
              {revenueData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Revenue Breakdown
                    </CardTitle>
                    <CardDescription>Entry fee revenue by tournament type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="revenue" fill={COLORS.success} name="Revenue (₹)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Trend Chart */}
              {trendData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      7-Day Trend
                    </CardTitle>
                    <CardDescription>Registration trends over the last week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Line type="monotone" dataKey="registrations" stroke={COLORS.primary} name="Total" />
                        <Line type="monotone" dataKey="approved" stroke={COLORS.success} name="Approved" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </motion.div>

        <Tabs value={selectedGame} onValueChange={(value) => setSelectedGame(value as any)}>
          <TabsList className="grid w-full max-w-md grid-cols-2" data-testid="tabs-game-selection">
            <TabsTrigger value="bgmi" data-testid="tab-bgmi">BGMI</TabsTrigger>
            <TabsTrigger value="freefire" data-testid="tab-freefire">Free Fire</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedGame}>
            <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as any)}>
              <TabsList className="grid w-full max-w-md grid-cols-3 mb-6" data-testid="tabs-mode-selection">
                <TabsTrigger value="solo" data-testid="tab-solo">Solo</TabsTrigger>
                <TabsTrigger value="duo" data-testid="tab-duo">Duo</TabsTrigger>
                <TabsTrigger value="squad" data-testid="tab-squad">Squad</TabsTrigger>
              </TabsList>

              {/* Advanced Search and Filters */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Advanced Filters & Search
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, Game ID, WhatsApp, Transaction ID, or notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search"
                    />
                  </div>

                  {/* Filter Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs mb-2 block">Status</Label>
                      <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                        <SelectTrigger data-testid="select-status-filter">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs mb-2 block">Date Range</Label>
                      <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                        <SelectTrigger data-testid="select-date-filter">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">Last 7 Days</SelectItem>
                          <SelectItem value="month">Last 30 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs mb-2 block">Flagged</Label>
                      <Select value={flagFilter} onValueChange={(value: any) => setFlagFilter(value)}>
                        <SelectTrigger data-testid="select-flag-filter">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="flagged">Flagged Only</SelectItem>
                          <SelectItem value="unflagged">Not Flagged</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs mb-2 block">Payment</Label>
                      <Select value={paymentFilter} onValueChange={(value: any) => setPaymentFilter(value)}>
                        <SelectTrigger data-testid="select-payment-filter">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="unverified">Unverified</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Active Filters Display */}
                  {(searchQuery || statusFilter !== "all" || dateFilter !== "all" || flagFilter !== "all" || paymentFilter !== "all") && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                      <span className="text-xs text-muted-foreground">Active filters:</span>
                      {searchQuery && (
                        <Badge variant="outline" className="gap-1">
                          Search: {searchQuery}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                        </Badge>
                      )}
                      {statusFilter !== "all" && (
                        <Badge variant="outline" className="gap-1">
                          Status: {statusFilter}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => setStatusFilter("all")} />
                        </Badge>
                      )}
                      {dateFilter !== "all" && (
                        <Badge variant="outline" className="gap-1">
                          Date: {dateFilter}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => setDateFilter("all")} />
                        </Badge>
                      )}
                      {flagFilter !== "all" && (
                        <Badge variant="outline" className="gap-1">
                          Flag: {flagFilter}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => setFlagFilter("all")} />
                        </Badge>
                      )}
                      {paymentFilter !== "all" && (
                        <Badge variant="outline" className="gap-1">
                          Payment: {paymentFilter}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => setPaymentFilter("all")} />
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("all");
                          setDateFilter("all");
                          setFlagFilter("all");
                          setPaymentFilter("all");
                        }}
                        className="h-6 text-xs"
                      >
                        Clear All
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bulk Actions and Export Options */}
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground mr-2">
                      {stats.total} results {selectedRegistrations.size > 0 && `(${selectedRegistrations.size} selected)`}
                    </span>

                    {selectedRegistrations.size > 0 && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          className="gap-2"
                          onClick={handleBulkApprove}
                          data-testid="button-bulk-approve"
                        >
                          <Check className="w-4 h-4" />
                          Approve Selected
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-2"
                          onClick={handleBulkReject}
                          data-testid="button-bulk-reject"
                        >
                          <X className="w-4 h-4" />
                          Reject Selected
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => setBulkDeleteDialogOpen(true)}
                          data-testid="button-bulk-delete"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Selected
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={handleExportSelected}
                          data-testid="button-export-selected"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          Export Selected
                        </Button>
                      </>
                    )}

                    {stats.pending > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => setApproveAllDialogOpen(true)}
                        data-testid="button-approve-all-pending"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve All Pending ({stats.pending})
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => setQrDialogOpen(true)}
                      data-testid="button-manage-qr"
                    >
                      <QrCode className="w-4 h-4" />
                      Manage QR
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" className="gap-2" data-testid="button-export-menu">
                          <Download className="w-4 h-4" />
                          Export
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleExportToExcel}>
                          <FileSpreadsheet className="w-4 h-4 mr-2" />
                          Export All to Excel
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportWhatsAppNumbers}>
                          <PhoneCall className="w-4 h-4 mr-2" />
                          Copy WhatsApp Numbers
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportGameIDs}>
                          <Gamepad2 className="w-4 h-4 mr-2" />
                          Copy Game IDs
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handlePrintView}>
                          <Printer className="w-4 h-4 mr-2" />
                          Print View
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      size="sm"
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

              {/* Mode Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

              {/* Registration Cards */}
              {["solo", "duo", "squad"].map((mode) => (
                <TabsContent key={mode} value={mode} className="space-y-4">
                  {filteredRegistrations.length === 0 ? (
                    <Card data-testid="card-no-registrations">
                      <CardContent className="pt-6">
                        <div className="text-center py-12">
                          <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-xl font-semibold mb-2">No Registrations Found</h3>
                          <p className="text-muted-foreground">
                            {searchQuery || statusFilter !== "all" || dateFilter !== "all" || flagFilter !== "all" || paymentFilter !== "all"
                              ? "Try adjusting your filters or search query."
                              : "No registrations found for this tournament mode."}
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
                        <Card key={registration.id} data-testid={`card-registration-${registration.id}`} className={`overflow-hidden ${registration.isFlagged === 1 ? 'border-destructive/50 bg-destructive/5' : ''}`}>
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
                                    {registration.isFlagged === 1 && (
                                      <Badge variant="destructive" className="gap-1">
                                        <Flag className="w-3 h-3" />
                                        Flagged
                                      </Badge>
                                    )}
                                    {registration.paymentVerified === 1 && (
                                      <Badge className="gap-1 bg-success/10 text-success hover:bg-success/20 border-success/20">
                                        <BadgeCheck className="w-3 h-3" />
                                        Verified
                                      </Badge>
                                    )}
                                  </CardTitle>
                                  <CardDescription className="mt-1 flex items-center gap-2 flex-wrap">
                                    <span className="text-xs text-muted-foreground" data-testid={`text-submitted-time-${registration.id}`}>
                                      {formatDistanceToNow(new Date(registration.submittedAt), { addSuffix: true })}
                                    </span>
                                    {registration.lastModifiedAt && (
                                      <>
                                        <span className="text-xs text-muted-foreground">•</span>
                                        <span className="text-xs text-muted-foreground">
                                          Modified {formatDistanceToNow(new Date(registration.lastModifiedAt), { addSuffix: true })}
                                          {registration.lastModifiedBy && ` by ${registration.lastModifiedBy}`}
                                        </span>
                                      </>
                                    )}
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
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="outline" className="gap-2" data-testid={`button-actions-${registration.id}`}>
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleOpenEdit(registration)}>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleOpenNotes(registration)}>
                                      <StickyNote className="w-4 h-4 mr-2" />
                                      {registration.adminNotes ? "Edit Notes" : "Add Notes"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleFlag(registration.id)}>
                                      <Flag className="w-4 h-4 mr-2" />
                                      {registration.isFlagged === 1 ? "Unflag" : "Flag"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleVerifyPayment(registration.id)}>
                                      <BadgeCheck className="w-4 h-4 mr-2" />
                                      {registration.paymentVerified === 1 ? "Unverify Payment" : "Verify Payment"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleViewActivityLog(registration)}>
                                      <Eye className="w-4 h-4 mr-2" />
                                      View History
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleOpenDelete(registration.id)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </CardHeader>

                          <Separator />

                          <CardContent className="pt-4 space-y-4">
                            {/* Admin Notes Display */}
                            {registration.adminNotes && (
                              <div className="bg-muted/50 border rounded-lg p-3">
                                <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  Admin Notes
                                </h4>
                                <p className="text-sm whitespace-pre-wrap">{registration.adminNotes}</p>
                              </div>
                            )}

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
                                  <div className="flex items-center gap-2">
                                    <p className="font-mono text-sm flex-1" data-testid={`text-game-id-${registration.id}`}>{registration.gameId}</p>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => handleCopy(registration.gameId, "Game ID")}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">WhatsApp</p>
                                  <div className="flex items-center gap-2">
                                    <p className="font-mono text-sm flex-1" data-testid={`text-whatsapp-${registration.id}`}>{registration.whatsapp}</p>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => handleCopy(registration.whatsapp, "WhatsApp number")}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
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
                                          <div className="flex items-center gap-2">
                                            <p className="font-mono text-sm flex-1" data-testid={`text-player2-id-${registration.id}`}>{registration.player2GameId}</p>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6"
                                              onClick={() => handleCopy(registration.player2GameId || "", "Game ID")}
                                            >
                                              <Copy className="w-3 h-3" />
                                            </Button>
                                          </div>
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
                                          <div className="flex items-center gap-2">
                                            <p className="font-mono text-sm flex-1" data-testid={`text-player3-id-${registration.id}`}>{registration.player3GameId}</p>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6"
                                              onClick={() => handleCopy(registration.player3GameId || "", "Game ID")}
                                            >
                                              <Copy className="w-3 h-3" />
                                            </Button>
                                          </div>
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
                                          <div className="flex items-center gap-2">
                                            <p className="font-mono text-sm flex-1" data-testid={`text-player4-id-${registration.id}`}>{registration.player4GameId}</p>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6"
                                              onClick={() => handleCopy(registration.player4GameId || "", "Game ID")}
                                            >
                                              <Copy className="w-3 h-3" />
                                            </Button>
                                          </div>
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
                            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(page => (
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
                            {totalPages > 10 && <span className="text-sm text-muted-foreground">...</span>}
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
          </TabsContent>
        </Tabs>

        {/* QR Code Dialog */}
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

        {/* Notes Dialog */}
        <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
          <DialogContent data-testid="dialog-notes">
            <DialogHeader>
              <DialogTitle>Admin Notes</DialogTitle>
              <DialogDescription>
                Add or edit internal notes for this registration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={currentNotes}
                onChange={(e) => setCurrentNotes(e.target.value)}
                placeholder="Add notes about this registration..."
                rows={6}
                data-testid="textarea-notes"
              />
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveNotes} disabled={notesMutation.isPending}>
                  {notesMutation.isPending ? "Saving..." : "Save Notes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit">
            <DialogHeader>
              <DialogTitle>Edit Registration Details</DialogTitle>
              <DialogDescription>
                Update registration information
              </DialogDescription>
            </DialogHeader>
            {editingRegistration && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Team Name (Optional)</Label>
                    <Input
                      value={editingRegistration.teamName || ""}
                      onChange={(e) => setEditingRegistration({...editingRegistration, teamName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Player Name *</Label>
                    <Input
                      value={editingRegistration.playerName}
                      onChange={(e) => setEditingRegistration({...editingRegistration, playerName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Game ID *</Label>
                    <Input
                      value={editingRegistration.gameId}
                      onChange={(e) => setEditingRegistration({...editingRegistration, gameId: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>WhatsApp *</Label>
                    <Input
                      value={editingRegistration.whatsapp}
                      onChange={(e) => setEditingRegistration({...editingRegistration, whatsapp: e.target.value})}
                    />
                  </div>

                  {/* Player 2 */}
                  {(activeMode === "duo" || activeMode === "squad") && (
                    <>
                      <div>
                        <Label>Player 2 Name</Label>
                        <Input
                          value={editingRegistration.player2Name || ""}
                          onChange={(e) => setEditingRegistration({...editingRegistration, player2Name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Player 2 Game ID</Label>
                        <Input
                          value={editingRegistration.player2GameId || ""}
                          onChange={(e) => setEditingRegistration({...editingRegistration, player2GameId: e.target.value})}
                        />
                      </div>
                    </>
                  )}

                  {/* Player 3 & 4 for Squad */}
                  {activeMode === "squad" && (
                    <>
                      <div>
                        <Label>Player 3 Name</Label>
                        <Input
                          value={editingRegistration.player3Name || ""}
                          onChange={(e) => setEditingRegistration({...editingRegistration, player3Name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Player 3 Game ID</Label>
                        <Input
                          value={editingRegistration.player3GameId || ""}
                          onChange={(e) => setEditingRegistration({...editingRegistration, player3GameId: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Player 4 Name</Label>
                        <Input
                          value={editingRegistration.player4Name || ""}
                          onChange={(e) => setEditingRegistration({...editingRegistration, player4Name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Player 4 Game ID</Label>
                        <Input
                          value={editingRegistration.player4GameId || ""}
                          onChange={(e) => setEditingRegistration({...editingRegistration, player4GameId: e.target.value})}
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <Label>Transaction ID *</Label>
                    <Input
                      value={editingRegistration.transactionId}
                      onChange={(e) => setEditingRegistration({...editingRegistration, transactionId: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => {
                    setEditDialogOpen(false);
                    setEditingRegistration(null);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEdit} disabled={editMutation.isPending}>
                    {editMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent data-testid="dialog-delete-confirm">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this registration
                and decrement the tournament slot count.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
          <AlertDialogContent data-testid="dialog-bulk-delete-confirm">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedRegistrations.size} Registrations?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete {selectedRegistrations.size} selected
                registrations and decrement the tournament slot counts.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">
                {bulkDeleteMutation.isPending ? "Deleting..." : `Delete ${selectedRegistrations.size}`}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Approve All Dialog */}
        <AlertDialog open={approveAllDialogOpen} onOpenChange={setApproveAllDialogOpen}>
          <AlertDialogContent data-testid="dialog-approve-all-confirm">
            <AlertDialogHeader>
              <AlertDialogTitle>Approve All Pending Registrations?</AlertDialogTitle>
              <AlertDialogDescription>
                This will approve {stats.pending} pending registrations for {selectedGame.toUpperCase()} {activeMode}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleApproveAll}>
                {approveAllMutation.isPending ? "Approving..." : `Approve ${stats.pending}`}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Activity Log Dialog */}
        <Dialog open={activityLogDialogOpen} onOpenChange={setActivityLogDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh]" data-testid="dialog-activity-log">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Activity Log
              </DialogTitle>
              <DialogDescription>
                {activityTarget.id ? "Registration history" : "Recent admin actions"}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {activityTarget.id && targetLogsError && (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-2" />
                    <p className="text-destructive font-medium">Failed to load activity logs</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Unable to fetch logs for this registration. Please try again.
                    </p>
                  </div>
                )}
                {!targetLogsError && (activityTarget.id ? targetActivityLogs : activityLogs)?.map((log) => (
                  <Card key={log.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{log.action}</Badge>
                          <span className="text-xs text-muted-foreground">
                            by {log.adminUsername}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(log.timestamp), "PPpp")}
                        </p>
                        {log.details && (
                          <p className="text-sm mt-2">
                            {JSON.parse(log.details).playerName && (
                              <span className="font-medium">
                                {JSON.parse(log.details).playerName}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                {!targetLogsError && (activityTarget.id ? targetActivityLogs : activityLogs)?.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No activity logs found</p>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Lightbox for Payment Screenshots */}
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={[{ src: lightboxImage }]}
        />
      </div>
    </div>
  );
}
