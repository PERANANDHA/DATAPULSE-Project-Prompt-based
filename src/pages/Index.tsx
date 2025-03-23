
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart4, LineChart, FileSpreadsheet, Users } from 'lucide-react';

const Index = () => {
  const [isHovered, setIsHovered] = useState(false);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const features = [
    {
      icon: <BarChart4 className="h-8 w-8 text-primary" />,
      title: "Comprehensive Analytics",
      description: "Get detailed insights with grade distributions, pass percentages, and performance metrics."
    },
    {
      icon: <FileSpreadsheet className="h-8 w-8 text-primary" />,
      title: "Excel Integration",
      description: "Seamlessly upload and analyze Excel spreadsheets with automatic data processing."
    },
    {
      icon: <LineChart className="h-8 w-8 text-primary" />,
      title: "Performance Tracking",
      description: "Identify top performers and students who need additional support."
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Personalized Reports",
      description: "Generate and download custom reports for individual students and classes."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Improved Background with Better Contrast */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F97316] via-[#0EA5E9] to-[#33C3F0] opacity-40 z-0"></div>
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-black/30 backdrop-blur-sm"></div>
        <div className="absolute top-20 left-20 w-60 h-60 rounded-full bg-orange-500 opacity-20 blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-blue-500 opacity-20 blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full bg-white opacity-10 blur-2xl"></div>
      </div>
      
      {/* College Logo in Left Upper Corner with improved visibility */}
      <div className="absolute top-4 left-4 z-10 flex items-center bg-white p-2 rounded-lg shadow-md">
        <img 
          src="/lovable-uploads/c8d5fc43-569a-4b7e-9366-09b681f0e06f.png" 
          alt="K.S. Rangasamy College of Technology" 
          className="h-16 md:h-20"
        />
      </div>

      <header className="py-6 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="container-centered flex justify-end items-center">
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="outline" size="sm" className="bg-[#F97316] hover:bg-[#F97316]/90 text-white font-medium border-transparent">Log in</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="font-medium">Sign up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow relative z-10">
        <section className="py-16 md:py-24">
          <div className="container-centered">
            <motion.div 
              className="max-w-3xl mx-auto text-center"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp}>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-black/30 text-white mb-4 backdrop-blur-sm shadow-sm">
                  <span className="text-white font-bold">For Class Advisors</span>
                </span>
              </motion.div>
              <motion.h2 
                className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6 text-white drop-shadow-md"
                variants={fadeInUp}
              >
                <span className="bg-black/30 px-2 py-1 rounded inline-block mb-2">Transform student data into</span> <span className="text-white font-bold bg-black/30 px-2 py-1 rounded">actionable insights</span>
              </motion.h2>
              <motion.p 
                className="text-lg text-white font-medium mb-8 bg-black/20 p-3 rounded-lg backdrop-blur-sm inline-block"
                variants={fadeInUp}
              >
                A powerful platform designed for educational professionals to analyze, track, and improve student performance with just a few clicks.
              </motion.p>
              <motion.div variants={fadeInUp}>
                <Link to="/signup">
                  <Button 
                    size="lg" 
                    className="rounded-full px-8 group bg-white text-primary hover:bg-white/90 shadow-lg font-medium"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    Get Started
                    <ArrowRight 
                      className={`ml-2 h-4 w-4 transition-transform duration-300 ${isHovered ? 'transform translate-x-1' : ''}`} 
                    />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="py-16 bg-white/90 backdrop-blur-sm">
          <div className="container-centered">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-semibold mb-4">Features Designed for Educators</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our platform provides powerful tools to help you understand student performance and make data-driven decisions.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-card p-6 rounded-lg shadow-sm card-hover"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container-centered">
            <div className="bg-white/90 backdrop-blur-sm p-8 md:p-12 rounded-xl shadow-lg text-center border border-white/20">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-3xl font-semibold mb-4">Ready to Optimize Your Analysis Process?</h2>
                <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Join other educators who are using ResultAnalyzer to save time and gain deeper insights into student performance.
                </p>
                <Link to="/signup">
                  <Button size="lg">Create Your Account</Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 relative z-10 bg-white/90 backdrop-blur-sm">
        <div className="container-centered">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} ResultAnalyzer. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm">Privacy</a>
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm">Terms</a>
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
