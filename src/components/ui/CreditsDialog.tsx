import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
const CreditsDialog = () => {
  return <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Info className="h-4 w-4" />
          Credits
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md py-[50px] my-[10px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Project Credits
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-6 py-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-muted-foreground mb-1">PROJECT LEAD</h3>
            <p className="text-xl font-bold">K L PERANANDHA</p>
            <p className="text-sm text-muted-foreground mt-1">(BATCH: 2023-27)</p>
          </div>
          
          <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
          
          <div className="text-center">
            <h3 className="text-lg font-semibold text-muted-foreground mb-3">TEAM MEMBERS</h3>
            <p className="text-xl font-bold mb-1">A SHANMUGESHWARA</p>
            <p className="text-sm text-muted-foreground">(BATCH: 2023-27)</p>
            <div className="my-2"></div>
            <p className="text-xl font-bold mb-1">R P ASHWINI</p>
            <p className="text-sm text-muted-foreground">(BATCH: 2023-27)</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};
export default CreditsDialog;