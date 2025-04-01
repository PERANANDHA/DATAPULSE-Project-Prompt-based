
import React from 'react';
import { Button } from '@/components/ui/button';
import { Award, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';

const CreditsDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Award className="h-4 w-4" />
          Credits
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
              Credits
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-primary">Project Lead</h3>
            <p className="text-lg text-primary/90 font-medium">K L PERANANDHA</p>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-primary">Team Members</h3>
            <ul className="space-y-2">
              <li className="text-lg text-primary/90 font-medium">A SHANMUGESHWARA</li>
              <li className="text-lg text-primary/90 font-medium">R P ASHWINI</li>
            </ul>
          </div>
          
          <div className="mt-6 rounded-lg bg-gradient-to-r from-purple-100 to-blue-100 p-4">
            <p className="text-center text-sm text-muted-foreground">
              Thank you for using our SGPA/CGPA Analysis Tool
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreditsDialog;
