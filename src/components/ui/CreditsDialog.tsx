
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Button } from "./button";

export function CreditsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Credits</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-4">
            Project Credits
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">PROJECT GUIDE</h3>
            <p>K KAVIARASU (CSE DEPT)</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-2">PROJECT LEAD</h3>
            <p>K L PERANANDHA (CSE BATCH: 2023-27)</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-2">TEAM MEMBERS</h3>
            <ul className="list-none space-y-2">
              <li>A SHANMUGESHWARA (CSE BATCH: 2023-27)</li>
              <li>R P ASHWINI (CSE BATCH: 2023-27)</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
