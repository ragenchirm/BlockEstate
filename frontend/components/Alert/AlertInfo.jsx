import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

const AlertInfo = ({ data, isConfirming, error, isConfirmed, chainId, alertDescription }) => {
  const { toast } = useToast();
  const msgTransactionInProgress = alertDescription?alertDescription:"Transaction in progress..."

  useEffect(() => {
    if (chainId) {
      toast({
        title: "INFO",
        description: "You're on the expected network with the ID: " + chainId,
        className: "bg-orange-400",
      });
    }
  }, [isConfirming, toast]);

  useEffect(() => {
    if (isConfirming) {
      toast({
        title: "Loading",
        description: msgTransactionInProgress,
        className: "bg-orange-400",
      });
    } else if (isConfirmed) {
      toast({
        title: "Success",
        description: `Data updated: ${data}`,
        className: "bg-green-600",
      });
    } else if (error) {
      toast({
        title: "Error",
        description: error.shortMessage || error.message,
        className: "bg-red-600",
      });
    }
  }, [isConfirming, isConfirmed, error, data, toast]);

  return null;
};

export default AlertInfo;
