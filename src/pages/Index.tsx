
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart4, LineChart, FileSpreadsheet, Users } from 'lucide-react';
import { useBreakpointValue } from '@/hooks/use-mobile';
import PageBackground from '@/components/ui/PageBackground';

const Index = () => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Use responsive text sizes
  const heroTitleSize = useBreakpointValue({
    base: "text-4xl",
    sm: "text-6xl",
    md: "text-7xl",
    lg: "text-8xl"
  });

  const heroParagraphSize = useBreakpointValue({
    base: "text-lg",
    md: "text-xl"
  });

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
    <PageBackground variant="gradient">
      {/* College Logo and Auth Buttons moved to the same section */}
      <div className="p-4 flex justify-between items-center">
        <div className="bg-white p-2 rounded-lg shadow-md inline-flex">
          <img 
            src="/lovable-uploads/c8d5fc43-569a-4b7e-9366-09b681f0e06f.png" 
            alt="K.S. Rangasamy College of Technology" 
            className="h-10 sm:h-12 md:h-16 w-auto"
          />
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Link to="/login">
            <Button variant="outline" size="sm" className="bg-[#F97316] hover:bg-[#F97316]/90 text-white font-medium border-transparent">Log in</Button>
          </Link>
          <Link to="/signup">
            <Button size="sm" className="font-medium">Sign up</Button>
          </Link>
        </div>
      </div>

      <main className="flex-grow">
        <section className="py-8 md:py-12 lg:py-20">
          <div className="container-centered px-4 sm:px-6">
            <motion.div 
              className="max-w-3xl mx-auto text-center"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp}>
                <span className="inline-block px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-blue-600 to-blue-400 text-white mb-4 sm:mb-6 shadow-lg">
                  For Class Advisors
                </span>
              </motion.div>
              <motion.h2 
                className={`${heroTitleSize || 'text-6xl'} font-extrabold tracking-tight mb-4 sm:mb-6 text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200 drop-shadow-lg`}
                variants={fadeInUp}
              >
                DATAPULSE
              </motion.h2>
              <motion.div 
                className="w-32 h-1 bg-gradient-to-r from-blue-300 to-blue-500 mx-auto my-4"
                variants={fadeInUp}
              ></motion.div>
              <motion.div variants={fadeInUp} className="mt-6">
                <Link to="/signup">
                  <Button 
                    size="lg" 
                    className="rounded-full px-6 sm:px-8 group bg-gradient-to-r from-blue-600 to-blue-400 text-white hover:from-blue-700 hover:to-blue-500 shadow-lg font-bold"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    Get Started
                    <ArrowRight 
                      className={`ml-2 h-5 w-5 transition-transform duration-300 ${isHovered ? 'transform translate-x-1' : ''}`} 
                    />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="py-8 md:py-12 bg-white/95 backdrop-blur-sm">
          <div className="container-centered px-4 sm:px-6">
            <motion.div 
              className="text-center mb-8 md:mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-[#0EA5E9]">Features Designed for Educators</h2>
              <p className="text-gray-700 max-w-2xl mx-auto font-medium px-2 sm:px-4">
                Our platform provides powerful tools to help you understand student performance and make data-driven decisions.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-2 sm:px-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-gradient-to-br from-white to-blue-50 p-4 sm:p-6 rounded-lg shadow-md card-hover border border-blue-100"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="mb-3 text-[#F97316]">{feature.icon}</div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 text-[#0EA5E9]">{feature.title}</h3>
                  <p className="text-gray-700 text-sm sm:text-base">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-8 md:py-12 lg:py-16">
          <div className="container-centered px-4 sm:px-6">
            <div className="bg-white/95 backdrop-blur-sm p-6 md:p-8 rounded-xl shadow-lg text-center border border-white/30">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-[#0EA5E9]">Ready to Optimize Your Analysis Process?</h2>
                <p className="text-gray-700 mb-6 sm:mb-8 max-w-2xl mx-auto">
                  Join other educators who are using our platform to save time and gain deeper insights into student performance.
                </p>
                <Link to="/signup">
                  <Button size="lg" className="bg-gradient-to-r from-[#F97316] to-[#FF9500] text-white hover:from-[#FF9500] hover:to-[#F97316] font-bold">Create Your Account</Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-4 sm:py-6 bg-white/95 backdrop-blur-sm">
        <div className="container-centered px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-700 text-sm">
              © {new Date().getFullYear()} DataPulse. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-[#0EA5E9] hover:text-[#F97316] transition-colors text-sm">Privacy</a>
              <a href="#" className="text-[#0EA5E9] hover:text-[#F97316] transition-colors text-sm">Terms</a>
              <a href="#" className="text-[#0EA5E9] hover:text-[#F97316] transition-colors text-sm">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </PageBackground>
  );
};

export default Index;
