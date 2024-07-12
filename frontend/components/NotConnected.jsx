"use client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

const NotConnected = () => {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <Alert className="bg-[#F00]">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          Please connect your wallet to use the app !
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default NotConnected;
