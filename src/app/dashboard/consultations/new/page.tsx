"use client";

import { useRouter } from "next/navigation";
import { ConsultationForm } from "@/components/consultations/ConsultationForm";

export default function NewConsultationPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/dashboard/consultations");
  };

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">New Consultation</h1>
          <p className="text-muted-foreground mt-2">
            Add a new patient consultation
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <ConsultationForm onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
}
