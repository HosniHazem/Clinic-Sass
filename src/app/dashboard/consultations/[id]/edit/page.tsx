"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ConsultationForm } from "@/components/consultations/ConsultationForm";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Consultation } from "@/types/consultation";

export default function EditConsultationPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConsultation = async () => {
      if (!id) return;
      
      try {
        const response = await fetch(`/api/consultations/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch consultation');
        }
        
        const data = await response.json();
        if (data.success) {
          setConsultation(data.data);
        } else {
          throw new Error(data.error || 'Failed to load consultation');
        }
      } catch (error) {
        console.error('Error fetching consultation:', error);
        toast({
          title: "Error",
          description: "Failed to load consultation. Please try again.",
          variant: "destructive",
        });
        router.push("/dashboard/consultations");
      } finally {
        setIsLoading(false);
      }
    };

    fetchConsultation();
  }, [id, router, toast]);

  const handleSuccess = () => {
    toast({
      title: "Success",
      description: "Consultation updated successfully",
    });
    router.push(`/dashboard/consultations/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading consultation...</span>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Consultation not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit Consultation</h1>
          <p className="text-muted-foreground mt-2">
            Update consultation details
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <ConsultationForm 
            initialData={consultation} 
            onSuccess={handleSuccess} 
          />
        </div>
      </div>
    </div>
  );
}
