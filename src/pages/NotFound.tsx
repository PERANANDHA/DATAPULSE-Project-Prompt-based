
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import PageBackground from "@/components/ui/PageBackground";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <PageBackground variant="gradient">
      <motion.div 
        className="min-h-screen flex items-center justify-center px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center relative z-10 bg-white/50 p-8 rounded-2xl backdrop-blur-md shadow-xl border border-white/30">
          <h1 className="text-8xl font-bold text-[#0EA5E9] mb-6">404</h1>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Page not found</h2>
          <p className="text-gray-700 mb-8 max-w-md mx-auto">
            We couldn't find the page you're looking for. The page might have been moved or doesn't exist.
          </p>
          <Link to="/">
            <Button className="flex items-center bg-gradient-to-r from-[#F97316] to-[#FF9500] text-white hover:from-[#FF9500] hover:to-[#F97316] font-bold">
              <Home className="mr-2 h-4 w-4" />
              Return to Home
            </Button>
          </Link>
        </div>
      </motion.div>
    </PageBackground>
  );
};

export default NotFound;
