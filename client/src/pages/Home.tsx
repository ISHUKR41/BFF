import { Link } from "wouter";
import { Trophy, Users, Target, Zap, Shield, Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Join India's Most Professional Gaming Tournaments</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-none">
              Compete in <br />
              <span className="bg-gradient-to-r from-bgmi via-primary to-freefire bg-clip-text text-transparent">
                BGMI & Free Fire
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Professional tournaments with real-time slot tracking, secure payments, and exciting prize pools. Register now and showcase your skills!
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/bgmi" data-testid="button-bgmi-cta">
                <Button size="lg" className="gap-2 text-base font-semibold h-12 px-8 bg-bgmi hover:bg-bgmi/90 text-white">
                  Join BGMI Tournament
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/freefire" data-testid="button-freefire-cta">
                <Button size="lg" variant="outline" className="gap-2 text-base font-semibold h-12 px-8 border-freefire/30 text-freefire hover:bg-freefire/10">
                  Join Free Fire Tournament
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto pt-8">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground">₹350</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">Winner Prize</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground">6</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">Tournament Modes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground">Live</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">Real-time Slots</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Game Cards Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Game</h2>
            <p className="text-muted-foreground text-lg">Select your preferred battle royale game and tournament mode</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* BGMI Card */}
            <Card className="relative overflow-hidden hover-elevate transition-all duration-200" data-testid="card-bgmi">
              <div className="absolute top-0 right-0 w-32 h-32 bg-bgmi/10 rounded-full blur-3xl" />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">BGMI</CardTitle>
                    <CardDescription className="text-base">Battlegrounds Mobile India - The ultimate battle royale experience</CardDescription>
                  </div>
                  <Badge className="bg-bgmi/10 text-bgmi hover:bg-bgmi/20 border-bgmi/20">Featured</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <Users className="w-5 h-5 mx-auto mb-2 text-bgmi" />
                    <div className="text-sm font-semibold">Solo</div>
                    <div className="text-xs text-muted-foreground mt-1">100 Slots</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <Users className="w-5 h-5 mx-auto mb-2 text-bgmi" />
                    <div className="text-sm font-semibold">Duo</div>
                    <div className="text-xs text-muted-foreground mt-1">50 Teams</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <Shield className="w-5 h-5 mx-auto mb-2 text-bgmi" />
                    <div className="text-sm font-semibold">Squad</div>
                    <div className="text-xs text-muted-foreground mt-1">25 Teams</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Entry Fee</span>
                    <span className="font-semibold">₹20 - ₹80</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Winner Prize</span>
                    <span className="font-semibold text-success">₹350</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Per Kill</span>
                    <span className="font-semibold">₹9</span>
                  </div>
                </div>

                <Link href="/bgmi" data-testid="button-bgmi-register">
                  <Button className="w-full bg-bgmi hover:bg-bgmi/90 text-white gap-2">
                    Register Now
                    <Trophy className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Free Fire Card */}
            <Card className="relative overflow-hidden hover-elevate transition-all duration-200" data-testid="card-freefire">
              <div className="absolute top-0 right-0 w-32 h-32 bg-freefire/10 rounded-full blur-3xl" />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">Free Fire</CardTitle>
                    <CardDescription className="text-base">Fast-paced 10-minute battle royale action</CardDescription>
                  </div>
                  <Badge className="bg-freefire/10 text-freefire hover:bg-freefire/20 border-freefire/20">Popular</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <Users className="w-5 h-5 mx-auto mb-2 text-freefire" />
                    <div className="text-sm font-semibold">Solo</div>
                    <div className="text-xs text-muted-foreground mt-1">48 Slots</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <Users className="w-5 h-5 mx-auto mb-2 text-freefire" />
                    <div className="text-sm font-semibold">Duo</div>
                    <div className="text-xs text-muted-foreground mt-1">24 Teams</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <Shield className="w-5 h-5 mx-auto mb-2 text-freefire" />
                    <div className="text-sm font-semibold">Squad</div>
                    <div className="text-xs text-muted-foreground mt-1">12 Teams</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Entry Fee</span>
                    <span className="font-semibold">₹20 - ₹80</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Winner Prize</span>
                    <span className="font-semibold text-success">₹350</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Per Kill</span>
                    <span className="font-semibold">₹5</span>
                  </div>
                </div>

                <Link href="/freefire" data-testid="button-freefire-register">
                  <Button className="w-full bg-freefire hover:bg-freefire/90 text-white gap-2">
                    Register Now
                    <Trophy className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Simple steps to join the tournament</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold">Register</h3>
              <p className="text-muted-foreground">Choose your game, tournament mode, and fill in your details</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold">Pay Entry Fee</h3>
              <p className="text-muted-foreground">Complete payment via UPI and upload your transaction screenshot</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold">Compete & Win</h3>
              <p className="text-muted-foreground">Get approved, join the match, and compete for exciting prizes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 GameArena. Professional BGMI & Free Fire Tournaments.</p>
            <p className="mt-2">Play responsibly. Terms and conditions apply.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
