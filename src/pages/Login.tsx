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
import { ArrowLeft, Eye, EyeOff, AlertCircle, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  otp: z.string().min(6, { message: "Please enter a valid OTP." }).optional(),
  newPassword: z.string()
    .min(8, { message: "Password must be at least 8 characters." })
    .refine(password => /[A-Z]/.test(password), {
      message: "Password must contain at least one uppercase letter",
    })
    .refine(password => /[a-z]/.test(password), {
      message: "Password must contain at least one lowercase letter",
    })
    .refine(password => /[0-9]/.test(password), {
      message: "Password must contain at least one number",
    })
    .refine(password => /[^A-Za-z0-9]/.test(password), {
      message: "Password must contain at least one special character",
    })
    .optional(),
  confirmPassword: z.string().optional(),
  robotCheck: z.boolean().refine(val => val === true, {
    message: "Please confirm you're not a robot",
  }).optional(),
}).refine(data => !data.newPassword || data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAccountNotFound, setIsAccountNotFound] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'otp' | 'newPassword'>('email');
  const [users, setUsers] = useState<{email: string, password: string, phoneNumber: string}[]>([]);
  const [redirectToSignup, setRedirectToSignup] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load stored users from localStorage
  useEffect(() => {
    const storedUsers = localStorage.getItem('registeredUsers');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    }
  }, []);

  // Redirect to signup if needed
  useEffect(() => {
    if (redirectToSignup) {
      const timer = setTimeout(() => {
        navigate('/signup');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [redirectToSignup, navigate]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
      robotCheck: false,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setIsAccountNotFound(false);
    
    try {
      // Check if user exists in localStorage
      const userExists = users.some(user => user.email === values.email);
      
      if (!userExists) {
        console.log("Account not found:", values.email);
        setIsAccountNotFound(true);
        
        toast({
          variant: "destructive",
          title: "Login ID does not exist",
          description: "This email is not registered. You will be redirected to sign up page.",
        });
        
        setRedirectToSignup(true);
        setIsLoading(false);
        return;
      }
      
      // Check if password matches
      const user = users.find(user => user.email === values.email);
      if (user && user.password !== values.password) {
        toast({
          variant: "destructive",
          title: "Authentication failed",
          description: "The email or password you entered is incorrect.",
        });
        setIsLoading(false);
        return;
      }
      
      console.log("Login credentials:", values);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Logged in successfully!",
        description: "Welcome back to ResultAnalyzer.",
      });
      
      // Redirect to dashboard after successful login
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
      
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Authentication failed",
        description: "The email or password you entered is incorrect.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (values: ForgotPasswordValues) => {
    setIsLoading(true);
    
    try {
      // Check if email exists in registered users
      const userExists = users.some(user => user.email === values.email);
      
      if (forgotPasswordStep === 'email') {
        if (!values.robotCheck) {
          toast({
            variant: "destructive",
            title: "Verification required",
            description: "Please confirm you're not a robot.",
          });
          setIsLoading(false);
          return;
        }
        
        if (!userExists) {
          toast({
            variant: "destructive",
            title: "Account not found",
            description: "There is no account associated with this email address.",
          });
          setIsLoading(false);
          return;
        }
        
        // Simulate sending OTP
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast({
          title: "OTP Sent",
          description: "A one-time password has been sent to your registered phone number.",
        });
        
        setForgotPasswordStep('otp');
        setShowOtpVerification(true);
      } else if (forgotPasswordStep === 'otp') {
        // Simulate verifying OTP - in a real app, you would verify against a real OTP
        if (values.otp !== '123456') {
          toast({
            variant: "destructive",
            title: "Invalid OTP",
            description: "The OTP you entered is incorrect. Please try again.",
          });
          setIsLoading(false);
          return;
        }
        
        setForgotPasswordStep('newPassword');
        setShowOtpVerification(false);
      } else if (forgotPasswordStep === 'newPassword') {
        // In a real app, you would update the user's password in your database
        // Here we'll update it in localStorage
        const updatedUsers = users.map(user => {
          if (user.email === values.email) {
            return { ...user, password: values.newPassword as string };
          }
          return user;
        });
        
        localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));
        setUsers(updatedUsers);
        
        toast({
          title: "Password Reset Successful",
          description: "Your password has been reset. You can now log in with your new password.",
        });
        
        // Close dialog and reset form
        setShowForgotPassword(false);
        setForgotPasswordStep('email');
        forgotPasswordForm.reset();
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error processing your request. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const resetForgotPassword = () => {
    setForgotPasswordStep('email');
    forgotPasswordForm.reset();
    setShowForgotPassword(false);
    setShowOtpVerification(false);
  };

  // Function to generate a new OTP (demo purposes)
  const refreshOtp = () => {
    toast({
      title: "New OTP Sent",
      description: "A new OTP has been sent to your registered phone number.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to home
            </Link>
          </div>
          
          <div className="bg-card shadow-sm rounded-lg p-6 sm:p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-semibold mb-2">Welcome back</h1>
              <p className="text-muted-foreground text-sm">Enter your credentials to access your account</p>
            </div>
            
            {isAccountNotFound && (
              <div className="mb-6 p-3 border border-destructive/50 bg-destructive/10 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 text-destructive mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive">Account not found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This email is not registered. You will be redirected to 
                    <Link to="/signup" className="text-primary font-medium ml-1 hover:underline">
                      sign up
                    </Link> page in a few seconds.
                  </p>
                </div>
              </div>
            )}
            
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
                        <button 
                          type="button"
                          className="text-xs text-primary hover:underline"
                          onClick={() => setShowForgotPassword(true)}
                        >
                          Forgot password?
                        </button>
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
                
                <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Log in"}
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
        </motion.div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={resetForgotPassword}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              {forgotPasswordStep === 'email' && "Enter your email to receive an OTP on your registered phone number."}
              {forgotPasswordStep === 'otp' && "Enter the OTP sent to your registered phone number."}
              {forgotPasswordStep === 'newPassword' && "Create a new password for your account."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...forgotPasswordForm}>
            <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
              {forgotPasswordStep === 'email' && (
                <>
                  <FormField
                    control={forgotPasswordForm.control}
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
                    control={forgotPasswordForm.control}
                    name="robotCheck"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>I am not a robot</FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </>
              )}
              
              {forgotPasswordStep === 'otp' && (
                <FormField
                  control={forgotPasswordForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>One-Time Password</FormLabel>
                        <button 
                          type="button"
                          className="text-xs text-primary hover:underline flex items-center"
                          onClick={refreshOtp}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Resend OTP
                        </button>
                      </div>
                      <FormControl>
                        <Input placeholder="Enter 6-digit OTP" {...field} />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground mt-1">
                        For demonstration, use OTP: 123456
                      </p>
                    </FormItem>
                  )}
                />
              )}
              
              {forgotPasswordStep === 'newPassword' && (
                <>
                  <FormField
                    control={forgotPasswordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground mt-1">
                          Password must have at least 8 characters, including uppercase, lowercase, number, and special character.
                        </p>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={forgotPasswordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              
              <DialogFooter>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Processing..." : 
                    forgotPasswordStep === 'email' ? "Send OTP" : 
                    forgotPasswordStep === 'otp' ? "Verify OTP" : 
                    "Reset Password"
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* OTP Verification Dialog - Show when needed */}
      <Dialog open={showOtpVerification} onOpenChange={(open) => {
        if (!open) resetForgotPassword();
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>OTP Verification</DialogTitle>
            <DialogDescription>
              A one-time password has been sent to your registered phone number. 
              Please enter it below to continue.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...forgotPasswordForm}>
            <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
              <FormField
                control={forgotPasswordForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>One-Time Password</FormLabel>
                      <button 
                        type="button"
                        className="text-xs text-primary hover:underline flex items-center"
                        onClick={refreshOtp}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Resend OTP
                      </button>
                    </div>
                    <FormControl>
                      <Input placeholder="Enter 6-digit OTP" {...field} />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      For demonstration, use OTP: 123456
                    </p>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
