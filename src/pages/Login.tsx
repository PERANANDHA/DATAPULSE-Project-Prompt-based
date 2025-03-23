
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load stored users from localStorage
  useEffect(() => {
    const storedUsers = localStorage.getItem('registeredUsers');
    if (storedUsers) {
      setRegisteredUsers(JSON.parse(storedUsers));
    }
  }, []);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    
    try {
      // In a real application, this would call an API
      console.log("Form values:", values);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if user exists in localStorage for demo purposes
      const user = registeredUsers.find(user => user.email === values.email);
      
      if (!user) {
        setErrorMessage("No account found with this email address. Please sign up.");
        setShowError(true);
        setIsLoading(false);
        return;
      }
      
      if (user.password !== values.password) {
        setErrorMessage("Incorrect password. Please try again.");
        setShowError(true);
        setIsLoading(false);
        return;
      }
      
      // Store login status in localStorage
      localStorage.setItem('currentUser', JSON.stringify({
        name: user.name,
        email: user.email,
        isLoggedIn: true,
      }));
      
      toast({
        title: "Login successful!",
        description: "Welcome back! Redirecting to dashboard...",
      });
      
      // Redirect to dashboard after successful login
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Orange and Blue Background Design */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F97316] via-[#0EA5E9] to-[#33C3F0] opacity-30 z-0"></div>
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-white/10 backdrop-blur-sm"></div>
        <div className="absolute top-20 left-20 w-60 h-60 rounded-full bg-orange-400 opacity-20 blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-blue-400 opacity-20 blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full bg-white opacity-10 blur-2xl"></div>
      </div>
      
      {/* College Logo in Left Upper Corner */}
      <div className="absolute top-4 left-4 z-10 flex items-center bg-white p-2 rounded-lg shadow-md">
        <img 
          src="/lovable-uploads/c8d5fc43-569a-4b7e-9366-09b681f0e06f.png" 
          alt="K.S. Rangasamy College of Technology" 
          className="h-16 md:h-20"
        />
      </div>

      <div className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6 flex justify-end">
            <Link to="/" className="inline-flex items-center text-sm text-white hover:text-white/80 bg-black/30 px-3 py-1.5 rounded-md backdrop-blur-sm">
              Back to home
            </Link>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg p-6 sm:p-8 border border-white/20">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-semibold mb-2">Welcome back</h1>
              <p className="text-muted-foreground text-sm">Sign in to your account to continue</p>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your.email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                          Forgot password?
                        </Link>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            {...field} 
                          />
                          <button 
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={togglePasswordVisibility}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="remember" 
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                    onChange={(e) => form.setValue('rememberMe', e.target.checked)}
                  />
                  <label htmlFor="remember" className="text-sm text-muted-foreground">
                    Remember me for 30 days
                  </label>
                </div>
                
                <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link to="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </div>
          
          <Dialog open={showError} onOpenChange={setShowError}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-destructive mr-2" />
                  Login Error
                </DialogTitle>
                <DialogDescription>
                  {errorMessage}
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowError(false)}>
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
