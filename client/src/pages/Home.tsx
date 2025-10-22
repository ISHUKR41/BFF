import { Link } from "wouter";
import { Trophy, Users, Target, Zap, Shield, Award, ArrowRight, GamepadIcon, CreditCard, FileText, CheckCircle, Clock, Star, TrendingUp, Lock, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import bgmiCardImage from "@assets/generated_images/BGMI_game_card_image_01a91a4f.png";
import freeFireCardImage from "@assets/generated_images/Free_Fire_game_card_image_cf60f82b.png";
import { motion } from "framer-motion";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
            >
              <motion.div
                animate={{ 
                  y: [0, -3, 0],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Zap className="w-4 h-4 text-primary" />
              </motion.div>
              <span className="text-sm font-medium text-primary">Join India's Most Professional Gaming Tournaments</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold tracking-tight leading-none"
            >
              Compete in <br />
              <span className="bg-gradient-to-r from-bgmi via-primary to-freefire bg-clip-text text-transparent">
                BGMI & Free Fire
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Professional tournaments with real-time slot tracking, secure payments, and exciting prize pools. Register now and showcase your skills!
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
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
            </motion.div>

            {/* Quick Stats with Stagger Animation */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto pt-8"
            >
              <motion.div variants={itemVariants} className="text-center" data-testid="stat-prize">
                <div className="text-3xl md:text-4xl font-bold text-foreground">₹350</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">Winner Prize</div>
              </motion.div>
              <motion.div variants={itemVariants} className="text-center" data-testid="stat-modes">
                <div className="text-3xl md:text-4xl font-bold text-foreground">6</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">Tournament Modes</div>
              </motion.div>
              <motion.div variants={itemVariants} className="text-center" data-testid="stat-slots">
                <div className="text-3xl md:text-4xl font-bold text-foreground">Live</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">Real-time Slots</div>
              </motion.div>
            </motion.div>
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
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
            <Card className="relative overflow-hidden hover-elevate transition-all duration-200" data-testid="card-bgmi">
              <div className="absolute top-0 right-0 w-32 h-32 bg-bgmi/10 rounded-full blur-3xl" />
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <img 
                  src={bgmiCardImage} 
                  alt="BGMI Tournament" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
              </div>
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
            </motion.div>

            {/* Free Fire Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
            <Card className="relative overflow-hidden hover-elevate transition-all duration-200" data-testid="card-freefire">
              <div className="absolute top-0 right-0 w-32 h-32 bg-freefire/10 rounded-full blur-3xl" />
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <img 
                  src={freeFireCardImage} 
                  alt="Free Fire Tournament" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
              </div>
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
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works - Enhanced with 5 Steps */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Simple steps to join and compete in tournaments</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0 }}
            >
              <Card className="relative h-full hover-elevate" data-testid="card-step-1">
                <div className="absolute -top-4 left-6">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <span className="text-xl font-bold text-primary-foreground">1</span>
                  </div>
                </div>
                <CardHeader className="pt-10">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <GamepadIcon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Choose Your Game</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Select between BGMI or Free Fire based on your preference and expertise</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="relative h-full hover-elevate" data-testid="card-step-2">
                <div className="absolute -top-4 left-6">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <span className="text-xl font-bold text-primary-foreground">2</span>
                  </div>
                </div>
                <CardHeader className="pt-10">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Select Mode</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Choose Solo, Duo, or Squad tournament mode that suits your team</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="relative h-full hover-elevate" data-testid="card-step-3">
                <div className="absolute -top-4 left-6">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <span className="text-xl font-bold text-primary-foreground">3</span>
                  </div>
                </div>
                <CardHeader className="pt-10">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <CreditCard className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Pay Entry Fee</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Complete payment via QR code and upload your transaction screenshot</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="relative h-full hover-elevate" data-testid="card-step-4">
                <div className="absolute -top-4 left-6">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <span className="text-xl font-bold text-primary-foreground">4</span>
                  </div>
                </div>
                <CardHeader className="pt-10">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Fill Registration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Provide team name, player details, and in-game IDs in the registration form</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="relative h-full hover-elevate" data-testid="card-step-5">
                <div className="absolute -top-4 left-6">
                  <div className="w-12 h-12 rounded-full bg-success flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <CardHeader className="pt-10">
                  <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                    <Trophy className="w-6 h-6 text-success" />
                  </div>
                  <CardTitle className="text-lg">Get Match Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Receive approval and match details via WhatsApp to start competing</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Us</h2>
            <p className="text-muted-foreground text-lg">Experience the best tournament platform with premium features</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <Card className="hover-elevate" data-testid="feature-slot-tracking">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Real-time Slot Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Monitor available slots in real-time and never miss out on joining your favorite tournaments</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="hover-elevate" data-testid="feature-instant-approval">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-success" />
                  </div>
                  <CardTitle className="text-xl">Instant Approval</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Get approved quickly with our streamlined verification process and start playing immediately</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card className="hover-elevate" data-testid="feature-secure-payments">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-bgmi/10 flex items-center justify-center mb-4">
                    <Lock className="w-6 h-6 text-bgmi" />
                  </div>
                  <CardTitle className="text-xl">Secure Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Safe and secure payment processing through UPI with instant confirmation and receipt</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Card className="hover-elevate" data-testid="feature-fair-play">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-freefire/10 flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-freefire" />
                  </div>
                  <CardTitle className="text-xl">Fair Play Guarantee</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Strict anti-cheat policies and monitoring to ensure fair competition for all players</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Card className="hover-elevate" data-testid="feature-prize-distribution">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">24h Prize Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Guaranteed prize distribution within 24 hours of tournament completion directly to your account</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <Card className="hover-elevate" data-testid="feature-support">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                    <Award className="w-6 h-6 text-success" />
                  </div>
                  <CardTitle className="text-xl">24/7 Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Round-the-clock customer support to help you with any queries or issues during tournaments</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Players Say</h2>
            <p className="text-muted-foreground text-lg">Join thousands of satisfied players competing daily</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Card className="hover-elevate" data-testid="testimonial-1">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">RK</span>
                    </div>
                    <div>
                      <CardTitle className="text-base">Rahul Kumar</CardTitle>
                      <p className="text-sm text-muted-foreground">BGMI Player</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground">Best tournament platform I've used! Real-time slots and instant payments make it super convenient. Won ₹350 last week!</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="hover-elevate" data-testid="testimonial-2">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-freefire/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-freefire">AP</span>
                    </div>
                    <div>
                      <CardTitle className="text-base">Arjun Patel</CardTitle>
                      <p className="text-sm text-muted-foreground">Free Fire Player</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground">Professional setup with fair play rules. Love how they track everything in real-time. My squad plays here regularly!</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="hover-elevate" data-testid="testimonial-3">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-bgmi/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-bgmi">VS</span>
                    </div>
                    <div>
                      <CardTitle className="text-base">Vikram Singh</CardTitle>
                      <p className="text-sm text-muted-foreground">BGMI Squad Leader</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground">Fast approvals and prizes delivered within 24 hours as promised. Highly recommend for serious players looking to compete!</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-lg">Got questions? We've got answers</p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4" data-testid="faq-accordion">
            <AccordionItem value="item-1" className="border rounded-lg px-6 bg-card" data-testid="faq-item-1">
              <AccordionTrigger className="text-left hover:no-underline" data-testid="faq-trigger-1">
                How do I register for a tournament?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground" data-testid="faq-content-1">
                Registration is simple! First, choose your game (BGMI or Free Fire) and select your preferred tournament mode (Solo, Duo, or Squad). Then, pay the entry fee via the provided QR code and upload your payment screenshot. Finally, fill in the registration form with your team/player details and in-game IDs. Once submitted, you'll receive approval and match details on WhatsApp.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border rounded-lg px-6 bg-card" data-testid="faq-item-2">
              <AccordionTrigger className="text-left hover:no-underline" data-testid="faq-trigger-2">
                When will I receive match details?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground" data-testid="faq-content-2">
                After your registration is approved (usually within 15-30 minutes), you'll receive the complete match details including room ID, password, match timing, and tournament rules via WhatsApp. Make sure to provide a valid WhatsApp number during registration.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border rounded-lg px-6 bg-card" data-testid="faq-item-3">
              <AccordionTrigger className="text-left hover:no-underline" data-testid="faq-trigger-3">
                What happens if I disconnect during the match?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground" data-testid="faq-content-3">
                If you disconnect during a match, you can rejoin using the same room ID and password shared earlier. However, you must reconnect within 5 minutes. If you're unable to reconnect, your kills and position up to that point will still be counted for prize calculation. Please note that disconnections due to network issues are not eligible for refunds.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border rounded-lg px-6 bg-card" data-testid="faq-item-4">
              <AccordionTrigger className="text-left hover:no-underline" data-testid="faq-trigger-4">
                How are prizes distributed?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground" data-testid="faq-content-4">
                Prizes are distributed based on your final position and total kills. The winner receives the top prize (₹350 for most tournaments), and additional rewards are given for each kill (₹9 for BGMI, ₹5 for Free Fire). After the tournament ends and results are verified, prizes are transferred directly to your registered UPI ID within 24 hours.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border rounded-lg px-6 bg-card" data-testid="faq-item-5">
              <AccordionTrigger className="text-left hover:no-underline" data-testid="faq-trigger-5">
                Can I get a refund?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground" data-testid="faq-content-5">
                Refunds are only available if the tournament is cancelled by the organizers or if there's a technical issue on our end that prevents the match from starting. Once the match begins, entry fees are non-refundable. If you need to cancel your registration, please contact support at least 1 hour before the scheduled match time for a refund consideration.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
