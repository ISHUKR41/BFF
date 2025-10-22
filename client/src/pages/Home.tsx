import { Link } from "wouter";
import { Trophy, Users, Target, Zap, Shield, Award, ArrowRight, GamepadIcon, CreditCard, FileText, CheckCircle, Clock, Star, TrendingUp, Lock, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import bgmiCardImage from "@assets/generated_images/BGMI_game_card_image_01a91a4f.png";
import freeFireCardImage from "@assets/generated_images/Free_Fire_game_card_image_cf60f82b.png";
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import CountUp from "react-countup";

export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  // Parallax effects for hero background
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);

  // Spring physics for smooth animations
  const springConfig = { stiffness: 100, damping: 20, restDelta: 0.001 };

  // Container variants with stagger
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        ...springConfig
      }
    }
  };

  // Floating animation for badges
  const floatingVariants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Pulse animation for badges
  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Card hover variants
  const cardHoverVariants = {
    rest: { scale: 1 },
    hover: { 
      scale: 1.03,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  // Icon hover variants
  const iconHoverVariants = {
    rest: { rotate: 0, scale: 1 },
    hover: { 
      rotate: 10,
      scale: 1.2,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 10
      }
    }
  };

  // Gradient animation
  const [gradientPosition, setGradientPosition] = useState({ x: 50, y: 50 });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Animated Gradient Background with Parallax */}
        <motion.div 
          style={{ y, opacity }}
          className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background"
        />
        <motion.div 
          style={{ scale }}
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"
        />
        
        {/* Animated floating orbs */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-10 w-64 h-64 bg-bgmi/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-20 right-10 w-64 h-64 bg-freefire/5 rounded-full blur-3xl"
        />
        
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <motion.div
              variants={floatingVariants}
              animate="animate"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
            >
              <motion.div 
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="flex items-center justify-center"
              >
                <Zap className="w-4 h-4 text-primary" />
              </motion.div>
              <span className="text-sm font-medium text-primary">Join India's Most Professional Gaming Tournaments</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, type: "spring", ...springConfig }}
              className="text-5xl md:text-7xl font-bold tracking-tight leading-none"
            >
              Compete in <br />
              <motion.span 
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  backgroundSize: "200% 200%"
                }}
                className="bg-gradient-to-r from-bgmi via-primary to-freefire bg-clip-text text-transparent"
              >
                BGMI & Free Fire
              </motion.span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, type: "spring", ...springConfig }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Professional tournaments with real-time slot tracking, secure payments, and exciting prize pools. Register now and showcase your skills!
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, type: "spring", ...springConfig }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <Link href="/bgmi" data-testid="button-bgmi-cta">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Button size="lg" className="gap-2 text-base font-semibold h-12 px-8 bg-bgmi hover:bg-bgmi/90 text-white relative overflow-hidden group">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.6 }}
                    />
                    <span className="relative">Join BGMI Tournament</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </Button>
                </motion.div>
              </Link>
              <Link href="/freefire" data-testid="button-freefire-cta">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Button size="lg" variant="outline" className="gap-2 text-base font-semibold h-12 px-8 border-freefire/30 text-freefire hover:bg-freefire/10 relative overflow-hidden group">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-freefire/10 to-transparent"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.6 }}
                    />
                    <span className="relative">Join Free Fire Tournament</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            {/* Quick Stats with Stagger Animation and Counter */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto pt-8"
            >
              <motion.div variants={itemVariants} className="text-center" data-testid="stat-prize">
                <motion.div 
                  className="text-3xl md:text-4xl font-bold text-foreground"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.5 }}
                >
                  ₹<CountUp end={350} duration={2} delay={0.5} />
                </motion.div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">Winner Prize</div>
              </motion.div>
              <motion.div variants={itemVariants} className="text-center" data-testid="stat-modes">
                <motion.div 
                  className="text-3xl md:text-4xl font-bold text-foreground"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.6 }}
                >
                  <CountUp end={6} duration={2} delay={0.6} />
                </motion.div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">Tournament Modes</div>
              </motion.div>
              <motion.div variants={itemVariants} className="text-center" data-testid="stat-slots">
                <motion.div 
                  className="text-3xl md:text-4xl font-bold text-foreground"
                  animate={{
                    color: ["hsl(var(--foreground))", "hsl(var(--primary))", "hsl(var(--foreground))"]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  Live
                </motion.div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">Real-time Slots</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Animated Divider */}
      <motion.div 
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
      />

      {/* Game Cards Section */}
      <section className="py-16 md:py-24 bg-muted/30 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Game</h2>
            <p className="text-muted-foreground text-lg">Select your preferred battle royale game and tournament mode</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* BGMI Card */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, type: "spring", ...springConfig }}
            >
            <motion.div
              variants={cardHoverVariants}
              whileHover="hover"
              initial="rest"
            >
            <Card className="relative overflow-visible hover-elevate transition-all duration-200 group" data-testid="card-bgmi">
              <motion.div 
                className="absolute top-0 right-0 w-32 h-32 bg-bgmi/10 rounded-full blur-3xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <motion.img 
                  src={bgmiCardImage} 
                  alt="BGMI Tournament" 
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
              </div>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">BGMI</CardTitle>
                    <CardDescription className="text-base">Battlegrounds Mobile India - The ultimate battle royale experience</CardDescription>
                  </div>
                  <motion.div
                    variants={pulseVariants}
                    animate="animate"
                  >
                    <Badge className="bg-bgmi/10 text-bgmi hover:bg-bgmi/20 border-bgmi/20" data-testid="badge-bgmi-featured">Featured</Badge>
                  </motion.div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <motion.div 
                  className="grid grid-cols-3 gap-4"
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {[
                    { icon: Users, title: "Solo", subtitle: "100 Slots", testId: "card-bgmi-solo-mode" },
                    { icon: Users, title: "Duo", subtitle: "50 Teams", testId: "card-bgmi-duo-mode" },
                    { icon: Shield, title: "Squad", subtitle: "25 Teams", testId: "card-bgmi-squad-mode" }
                  ].map((mode, index) => (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      whileHover="hover"
                      initial="rest"
                      className="text-center p-4 rounded-lg bg-muted/50 cursor-pointer"
                      data-testid={mode.testId}
                    >
                      <motion.div variants={iconHoverVariants}>
                        <mode.icon className="w-5 h-5 mx-auto mb-2 text-bgmi" />
                      </motion.div>
                      <div className="text-sm font-semibold">{mode.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">{mode.subtitle}</div>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div 
                  className="space-y-3"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center justify-between text-sm" data-testid="text-bgmi-entry-fee">
                    <span className="text-muted-foreground">Entry Fee</span>
                    <span className="font-semibold">₹20 - ₹80</span>
                  </div>
                  <div className="flex items-center justify-between text-sm" data-testid="text-bgmi-winner-prize">
                    <span className="text-muted-foreground">Winner Prize</span>
                    <motion.span 
                      className="font-semibold text-success"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      ₹350
                    </motion.span>
                  </div>
                  <div className="flex items-center justify-between text-sm" data-testid="text-bgmi-per-kill">
                    <span className="text-muted-foreground">Per Kill</span>
                    <span className="font-semibold">₹9</span>
                  </div>
                </motion.div>

                <Link href="/bgmi" data-testid="button-bgmi-register">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button className="w-full bg-bgmi hover:bg-bgmi/90 text-white gap-2 relative overflow-hidden group">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.6 }}
                      />
                      <span className="relative">Register Now</span>
                      <Trophy className="w-4 h-4 relative" />
                    </Button>
                  </motion.div>
                </Link>
              </CardContent>
            </Card>
            </motion.div>
            </motion.div>

            {/* Free Fire Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, type: "spring", ...springConfig }}
            >
            <motion.div
              variants={cardHoverVariants}
              whileHover="hover"
              initial="rest"
            >
            <Card className="relative overflow-visible hover-elevate transition-all duration-200 group" data-testid="card-freefire">
              <motion.div 
                className="absolute top-0 right-0 w-32 h-32 bg-freefire/10 rounded-full blur-3xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              />
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <motion.img 
                  src={freeFireCardImage} 
                  alt="Free Fire Tournament" 
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
              </div>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">Free Fire</CardTitle>
                    <CardDescription className="text-base">Fast-paced 10-minute battle royale action</CardDescription>
                  </div>
                  <motion.div
                    variants={pulseVariants}
                    animate="animate"
                  >
                    <Badge className="bg-freefire/10 text-freefire hover:bg-freefire/20 border-freefire/20" data-testid="badge-freefire-popular">Popular</Badge>
                  </motion.div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <motion.div 
                  className="grid grid-cols-3 gap-4"
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {[
                    { icon: Users, title: "Solo", subtitle: "48 Slots", testId: "card-freefire-solo-mode" },
                    { icon: Users, title: "Duo", subtitle: "24 Teams", testId: "card-freefire-duo-mode" },
                    { icon: Shield, title: "Squad", subtitle: "12 Teams", testId: "card-freefire-squad-mode" }
                  ].map((mode, index) => (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      whileHover="hover"
                      initial="rest"
                      className="text-center p-4 rounded-lg bg-muted/50 cursor-pointer"
                      data-testid={mode.testId}
                    >
                      <motion.div variants={iconHoverVariants}>
                        <mode.icon className="w-5 h-5 mx-auto mb-2 text-freefire" />
                      </motion.div>
                      <div className="text-sm font-semibold">{mode.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">{mode.subtitle}</div>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div 
                  className="space-y-3"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center justify-between text-sm" data-testid="text-freefire-entry-fee">
                    <span className="text-muted-foreground">Entry Fee</span>
                    <span className="font-semibold">₹20 - ₹80</span>
                  </div>
                  <div className="flex items-center justify-between text-sm" data-testid="text-freefire-winner-prize">
                    <span className="text-muted-foreground">Winner Prize</span>
                    <motion.span 
                      className="font-semibold text-success"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    >
                      ₹350
                    </motion.span>
                  </div>
                  <div className="flex items-center justify-between text-sm" data-testid="text-freefire-per-kill">
                    <span className="text-muted-foreground">Per Kill</span>
                    <span className="font-semibold">₹5</span>
                  </div>
                </motion.div>

                <Link href="/freefire" data-testid="button-freefire-register">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button className="w-full bg-freefire hover:bg-freefire/90 text-white gap-2 relative overflow-hidden group">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.6 }}
                      />
                      <span className="relative">Register Now</span>
                      <Trophy className="w-4 h-4 relative" />
                    </Button>
                  </motion.div>
                </Link>
              </CardContent>
            </Card>
            </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Animated Divider */}
      <motion.div 
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
      />

      {/* How It Works - Enhanced with 5 Steps */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Simple steps to join and compete in tournaments</p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-5 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              { icon: GamepadIcon, title: "Choose Your Game", desc: "Select between BGMI or Free Fire based on your preference and expertise", step: 1, color: "primary", testId: "card-step-1" },
              { icon: Users, title: "Select Mode", desc: "Choose Solo, Duo, or Squad tournament mode that suits your team", step: 2, color: "primary", testId: "card-step-2" },
              { icon: CreditCard, title: "Pay Entry Fee", desc: "Complete payment via QR code and upload your transaction screenshot", step: 3, color: "primary", testId: "card-step-3" },
              { icon: FileText, title: "Fill Registration", desc: "Provide team name, player details, and in-game IDs in the registration form", step: 4, color: "primary", testId: "card-step-4" },
              { icon: Trophy, title: "Get Match Details", desc: "Receive approval and match details via WhatsApp to start competing", step: 5, color: "success", testId: "card-step-5" }
            ].map((step, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
              >
                <Card className="relative h-full hover-elevate" data-testid={step.testId}>
                  <motion.div 
                    className="absolute -top-4 left-6"
                    animate={{
                      y: [0, -5, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.2
                    }}
                  >
                    <div className={`w-12 h-12 rounded-full bg-${step.color} flex items-center justify-center shadow-lg`}>
                      {step.step === 5 ? (
                        <CheckCircle className="w-6 h-6 text-white" />
                      ) : (
                        <span className="text-xl font-bold text-primary-foreground">{step.step}</span>
                      )}
                    </div>
                  </motion.div>
                  <CardHeader className="pt-10">
                    <motion.div 
                      className={`w-12 h-12 rounded-lg bg-${step.color}/10 flex items-center justify-center mb-4`}
                      whileHover="hover"
                      initial="rest"
                      variants={iconHoverVariants}
                    >
                      <step.icon className={`w-6 h-6 text-${step.color}`} />
                    </motion.div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Animated Divider */}
      <motion.div 
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
      />

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Us</h2>
            <p className="text-muted-foreground text-lg">Experience the best tournament platform with premium features</p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              { icon: TrendingUp, title: "Real-time Slot Tracking", desc: "Monitor available slots in real-time and never miss out on joining your favorite tournaments", color: "primary", testId: "feature-slot-tracking" },
              { icon: Zap, title: "Instant Approval", desc: "Get approved quickly with our streamlined verification process and start playing immediately", color: "success", testId: "feature-instant-approval" },
              { icon: Lock, title: "Secure Payments", desc: "Safe and secure payment processing through UPI with instant confirmation and receipt", color: "bgmi", testId: "feature-secure-payments" },
              { icon: Shield, title: "Fair Play Guarantee", desc: "Strict anti-cheat policies and monitoring to ensure fair competition for all players", color: "freefire", testId: "feature-fair-play" },
              { icon: Clock, title: "24h Prize Distribution", desc: "Guaranteed prize distribution within 24 hours of tournament completion directly to your account", color: "primary", testId: "feature-prize-distribution" },
              { icon: Award, title: "24/7 Support", desc: "Round-the-clock customer support to help you with any queries or issues during tournaments", color: "success", testId: "feature-support" }
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <Card className="hover-elevate h-full" data-testid={feature.testId}>
                  <CardHeader>
                    <motion.div 
                      className={`w-12 h-12 rounded-lg bg-${feature.color}/10 flex items-center justify-center mb-4`}
                      whileHover="hover"
                      initial="rest"
                      variants={iconHoverVariants}
                    >
                      <feature.icon className={`w-6 h-6 text-${feature.color}`} />
                    </motion.div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Animated Divider */}
      <motion.div 
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
      />

      {/* Testimonials Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Players Say</h2>
            <p className="text-muted-foreground text-lg">Join thousands of satisfied players competing daily</p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              { name: "Rahul Kumar", role: "BGMI Player", initials: "RK", review: "Best tournament platform I've used! Real-time slots and instant payments make it super convenient. Won ₹350 last week!", color: "primary", testId: "testimonial-1" },
              { name: "Arjun Patel", role: "Free Fire Player", initials: "AP", review: "Professional setup with fair play rules. Love how they track everything in real-time. My squad plays here regularly!", color: "freefire", testId: "testimonial-2" },
              { name: "Vikram Singh", role: "BGMI Squad Leader", initials: "VS", review: "Fast approvals and prizes delivered within 24 hours as promised. Highly recommend for serious players looking to compete!", color: "bgmi", testId: "testimonial-3" }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <Card className="hover-elevate h-full" data-testid={testimonial.testId}>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <motion.div 
                        className={`w-12 h-12 rounded-full bg-${testimonial.color}/10 flex items-center justify-center`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <span className={`text-lg font-bold text-${testimonial.color}`}>{testimonial.initials}</span>
                      </motion.div>
                      <div>
                        <CardTitle className="text-base">{testimonial.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1 + i * 0.1 }}
                        >
                          <Star className="w-4 h-4 fill-primary text-primary" />
                        </motion.div>
                      ))}
                    </div>
                    <p className="text-muted-foreground">{testimonial.review}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Animated Divider */}
      <motion.div 
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
      />

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-lg">Got questions? We've got answers</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Accordion type="single" collapsible className="w-full space-y-4" data-testid="faq-accordion">
              {[
                {
                  question: "How do I register for a tournament?",
                  answer: "Registration is simple! First, choose your game (BGMI or Free Fire) and select your preferred tournament mode (Solo, Duo, or Squad). Then, pay the entry fee via the provided QR code and upload your payment screenshot. Finally, fill in the registration form with your team/player details and in-game IDs. Once submitted, you'll receive approval and match details on WhatsApp.",
                  testId: "faq-item-1"
                },
                {
                  question: "When will I receive match details?",
                  answer: "After your registration is approved (usually within 15-30 minutes), you'll receive the complete match details including room ID, password, match timing, and tournament rules via WhatsApp. Make sure to provide a valid WhatsApp number during registration.",
                  testId: "faq-item-2"
                },
                {
                  question: "What happens if I disconnect during the match?",
                  answer: "If you disconnect during a match, you can rejoin using the same room ID and password shared earlier. However, you must reconnect within 5 minutes. If you're unable to reconnect, your kills and position up to that point will still be counted for prize calculation. Please note that disconnections due to network issues are not eligible for refunds.",
                  testId: "faq-item-3"
                },
                {
                  question: "How are prizes distributed?",
                  answer: "Prizes are distributed based on your final position and total kills. The winner receives the top prize (₹350 for most tournaments), and additional rewards are given for each kill (₹9 for BGMI, ₹5 for Free Fire). After the tournament ends and results are verified, prizes are transferred directly to your registered UPI ID within 24 hours.",
                  testId: "faq-item-4"
                },
                {
                  question: "Can I get a refund if I can't participate?",
                  answer: "Refunds are only available if you request cancellation at least 2 hours before the tournament start time. To request a refund, contact our support team on WhatsApp with your registration details. Refunds are processed within 24-48 hours to your original payment method.",
                  testId: "faq-item-5"
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <AccordionItem value={`item-${index + 1}`} className="border rounded-lg px-6 bg-card" data-testid={faq.testId}>
                    <AccordionTrigger className="text-left hover:no-underline" data-testid={`faq-trigger-${index + 1}`}>
                      <motion.span
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {faq.question}
                      </motion.span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground" data-testid={`faq-content-${index + 1}`}>
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Floating CTA Section */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, type: "spring", ...springConfig }}
        className="py-16 md:py-24"
      >
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-bgmi/10 via-primary/10 to-freefire/10 p-12 text-center border border-primary/20"
          >
            <motion.div
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                backgroundSize: "200% 200%"
              }}
              className="absolute inset-0 bg-gradient-to-r from-bgmi/5 via-primary/5 to-freefire/5 opacity-50"
            />
            <div className="relative">
              <motion.h2 
                className="text-3xl md:text-4xl font-bold mb-4"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  backgroundSize: "200% 200%"
                }}
              >
                Ready to Compete?
              </motion.h2>
              <p className="text-muted-foreground text-lg mb-8">Join thousands of players in India's most professional gaming tournaments</p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/bgmi" data-testid="button-cta-bgmi-bottom">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button size="lg" className="gap-2 bg-bgmi hover:bg-bgmi/90 text-white">
                      Join BGMI Now
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/freefire" data-testid="button-cta-freefire-bottom">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button size="lg" className="gap-2 bg-freefire hover:bg-freefire/90 text-white">
                      Join Free Fire Now
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
