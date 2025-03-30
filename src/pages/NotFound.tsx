
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Half Orange and Half Blue Background Design */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F97316] to-[#0EA5E9] opacity-70 z-0"></div>
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-black/15 backdrop-blur-sm"></div>
        <div className="absolute top-10 left-10 w-80 h-80 rounded-full bg-orange-500 opacity-40 blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-blue-400 opacity-30 blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full bg-white opacity-20 blur-2xl"></div>
      </div>
      
      <motion.div 
        className="text-center px-4 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-8xl font-bold text-white mb-6">404</h1>
        <h2 className="text-2xl font-semibold mb-4 text-white">Page not found</h2>
        <p className="text-white/90 mb-8 max-w-md mx-auto">
          We couldn't find the page you're looking for. The page might have been moved or doesn't exist.
        </p>
        <Link to="/">
          <Button className="flex items-center bg-gradient-to-r from-[#F97316] to-[#FF9500] text-white hover:from-[#FF9500] hover:to-[#F97316] font-bold">
            <Home className="mr-2 h-4 w-4" />
            Return to Home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
