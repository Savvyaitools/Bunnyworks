import { Button } from "@/components/ui/button";

interface FormSubmitButtonProps {
  isSubmitting?: boolean;
  label: string;
  loadingLabel?: string;
}

export function FormSubmitButton({ 
  isSubmitting, 
  label, 
  loadingLabel 
}: FormSubmitButtonProps) {
  return (
    <Button 
      type="submit" 
      className="w-full bg-gradient-primary"
      disabled={isSubmitting}
    >
      {isSubmitting ? (loadingLabel || "Saving...") : label}
    </Button>
  );
}
