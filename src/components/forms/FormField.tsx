import { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UseFormRegister, FieldError, Control, Controller } from "react-hook-form";
import { cn } from "@/lib/utils";

interface BaseFieldProps {
  label: string;
  name: string;
  error?: FieldError;
  required?: boolean;
  className?: string;
}

interface TextFieldProps extends BaseFieldProps {
  type: "text" | "email" | "number" | "date" | "password";
  placeholder?: string;
  register: UseFormRegister<any>;
  valueAsNumber?: boolean;
}

interface TextareaFieldProps extends BaseFieldProps {
  type: "textarea";
  placeholder?: string;
  register: UseFormRegister<any>;
  rows?: number;
}

interface SelectFieldProps extends BaseFieldProps {
  type: "select";
  control: Control<any>;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

type FormFieldProps = TextFieldProps | TextareaFieldProps | SelectFieldProps;

export function FormField(props: FormFieldProps) {
  const { label, name, error, required, className } = props;
  const hasError = !!error;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name}>
        {label}
        {required && " *"}
      </Label>
      
      {props.type === "textarea" ? (
        <Textarea
          id={name}
          {...props.register(name)}
          placeholder={props.placeholder}
          rows={props.rows || 3}
          className={cn(hasError && "border-destructive")}
        />
      ) : props.type === "select" ? (
        <Controller
          name={name}
          control={props.control}
          render={({ field }) => (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger className={cn(hasError && "border-destructive")}>
                <SelectValue placeholder={props.placeholder || `Select ${label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {props.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      ) : (
        <Input
          id={name}
          type={props.type}
          {...props.register(name, props.valueAsNumber ? { valueAsNumber: true } : undefined)}
          placeholder={props.placeholder}
          className={cn(hasError && "border-destructive")}
        />
      )}
      
      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
    </div>
  );
}

// Grid wrapper for consistent layouts
interface FormRowProps {
  children: ReactNode;
  cols?: 1 | 2 | 3;
}

export function FormRow({ children, cols = 2 }: FormRowProps) {
  return (
    <div className={cn(
      "grid gap-4",
      cols === 1 && "grid-cols-1",
      cols === 2 && "grid-cols-2",
      cols === 3 && "grid-cols-3"
    )}>
      {children}
    </div>
  );
}
