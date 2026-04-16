import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FelixChat } from "@/components/ai/FelixChat";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CoachPBF() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/of-ai")} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Coach PBF</h1>
            <p className="text-xs text-muted-foreground">Your personal AI agency coach</p>
          </div>
        </div>
        <FelixChat className="flex-1 min-h-0" />
      </div>
    </DashboardLayout>
  );
}
