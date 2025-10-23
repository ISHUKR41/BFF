import { Link, useLocation } from "wouter";
import { Trophy, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  const [location] = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-3 py-2" data-testid="link-home">
            <Trophy className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">
              Game<span className="text-primary">Arena</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/" data-testid="link-nav-home">
              <Button 
                variant={location === "/" ? "secondary" : "ghost"} 
                size="sm"
                className="font-medium"
              >
                Home
              </Button>
            </Link>
            <Link href="/bgmi" data-testid="link-nav-bgmi">
              <Button 
                variant={location === "/bgmi" ? "secondary" : "ghost"} 
                size="sm"
                className="font-medium"
              >
                BGMI
              </Button>
            </Link>
            <Link href="/freefire" data-testid="link-nav-freefire">
              <Button 
                variant={location === "/freefire" ? "secondary" : "ghost"} 
                size="sm"
                className="font-medium"
              >
                Free Fire
              </Button>
            </Link>
          </nav>

          {/* Theme Toggle & Admin Link */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/admin/login" data-testid="link-admin">
              <Button variant="outline" size="sm" className="gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
