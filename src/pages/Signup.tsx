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
import { ArrowLeft, Eye, EyeOff, Check, X, AlertTriangle } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

// Enhanced password validation
const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  staffId: z.string().min(1, { message: "Staff ID is required." }),
  phoneNumber: z.string().min(10, { message: "Please enter a valid phone number." }),
  department: z.string().min(1, { message: "Department name is required." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." })
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
    }),
  confirmPassword: z.string(),
  robotCheck: z.boolean().refine(val => val === true, {
    message: "Please confirm you are not a robot",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [existingUsers, setExistingUsers] = useState<{ email: string; staffId: string; phoneNumber: string }[]>([]);
  const [password, setPassword] = useState("");
  const [showRobotCheck, setShowRobotCheck] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Password validation criteria checks
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  // Load stored users from localStorage
  useEffect(() => {
    const storedUsers = localStorage.getItem('registeredUsers');
    if (storedUsers) {
      setExistingUsers(JSON.parse(storedUsers));
    } else {
      // Initialize with empty array if no users exist
      localStorage.setItem('registeredUsers', JSON.stringify([]));
    }
  }, []);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      staffId: "",
      phoneNumber: "",
      department: "",
      password: "",
      confirmPassword: "",
      robotCheck: false,
    },
  });

  // Update password state when form field changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    form.setValue("password", newPassword);
  };

  const onSubmit = async (values: SignupFormValues) => {
    setIsLoading(true);
    
    try {
      // Check if email already exists
      if (existingUsers.some(user => user.email === values.email)) {
        toast({
          variant: "destructive",
          title: "Email already in use",
          description: "An account with this email address already exists. Please log in or use a different email.",
        });
        setIsLoading(false);
        return;
      }
      
      // Check if staffId already exists
      if (existingUsers.some(user => user.staffId === values.staffId)) {
        toast({
          variant: "destructive",
          title: "Staff ID already in use",
          description: "An account with this Staff ID already exists. Please use a different Staff ID.",
        });
        setIsLoading(false);
        return;
      }
      
      // Check if phone number already exists
      if (existingUsers.some(user => user.phoneNumber === values.phoneNumber)) {
        toast({
          variant: "destructive",
          title: "Phone number already in use",
          description: "An account with this phone number already exists. Please use a different phone number.",
        });
        setIsLoading(false);
        return;
      }
      
      // Check if the robot verification is completed
      if (!values.robotCheck) {
        setShowRobotCheck(true);
        setIsLoading(false);
        return;
      }
      
      // In a real application, this would call an API
      console.log("Form values:", values);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Store user details in localStorage for demo purposes
      const newUser = {
        name: values.name,
        email: values.email,
        staffId: values.staffId,
        phoneNumber: values.phoneNumber,
        department: values.department,
        password: values.password,
      };
      
      const updatedUsers = [...existingUsers, newUser];
      localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));
      
      toast({
        title: "Account created!",
        description: "You've successfully signed up. Redirecting to login...",
      });
      
      // Redirect to login page after successful signup
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem creating your account. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

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
              <h1 className="text-2xl font-semibold mb-2">Create your account</h1>
              <p className="text-muted-foreground text-sm">Enter your details to get started</p>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="staffId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Staff ID</FormLabel>
                        <FormControl>
                          <Input placeholder="ST12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            type="tel" 
                            placeholder="+1 (555) 123-4567" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="Computer Science" {...field} />
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            {...field}
                            onChange={(e) => {
                              handlePasswordChange(e);
                              field.onChange(e);
                            }}
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
                      
                      {/* Password strength indicators */}
                      <div className="mt-2 space-y-1.5">
                        <p className="text-xs font-medium mb-1">Password must contain:</p>
                        <div className="grid grid-cols-1 gap-1">
                          <div className="flex items-center">
                            {hasMinLength ? 
                              <Check className="h-3 w-3 mr-2 text-green-500" /> : 
                              <X className="h-3 w-3 mr-2 text-red-500" />
                            }
                            <span className={`text-xs ${hasMinLength ? "text-green-500" : "text-muted-foreground"}`}>
                              At least 8 characters
                            </span>
                          </div>
                          <div className="flex items-center">
                            {hasUpperCase ? 
                              <Check className="h-3 w-3 mr-2 text-green-500" /> : 
                              <X className="h-3 w-3 mr-2 text-red-500" />
                            }
                            <span className={`text-xs ${hasUpperCase ? "text-green-500" : "text-muted-foreground"}`}>
                              At least one uppercase letter
                            </span>
                          </div>
                          <div className="flex items-center">
                            {hasLowerCase ? 
                              <Check className="h-3 w-3 mr-2 text-green-500" /> : 
                              <X className="h-3 w-3 mr-2 text-red-500" />
                            }
                            <span className={`text-xs ${hasLowerCase ? "text-green-500" : "text-muted-foreground"}`}>
                              At least one lowercase letter
                            </span>
                          </div>
                          <div className="flex items-center">
                            {hasNumber ? 
                              <Check className="h-3 w-3 mr-2 text-green-500" /> : 
                              <X className="h-3 w-3 mr-2 text-red-500" />
                            }
                            <span className={`text-xs ${hasNumber ? "text-green-500" : "text-muted-foreground"}`}>
                              At least one number
                            </span>
                          </div>
                          <div className="flex items-center">
                            {hasSpecialChar ? 
                              <Check className="h-3 w-3 mr-2 text-green-500" /> : 
                              <X className="h-3 w-3 mr-2 text-red-500" />
                            }
                            <span className={`text-xs ${hasSpecialChar ? "text-green-500" : "text-muted-foreground"}`}>
                              At least one special character
                            </span>
                          </div>
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showConfirmPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            {...field} 
                          />
                          <button 
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={toggleConfirmPasswordVisibility}
                          >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
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
                
                <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link to="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Robot verification dialog */}
      <Dialog open={showRobotCheck} onOpenChange={setShowRobotCheck}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              Verification Required
            </DialogTitle>
            <DialogDescription>
              Please confirm you are not a robot by checking the box before continuing.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <Button onClick={() => {
              form.setValue('robotCheck', true);
              setShowRobotCheck(false);
              form.handleSubmit(onSubmit)();
            }}>
              I am not a robot
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Signup;
