import * as React from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
}

export function FormInput({ name, label, className, ...props }: FormFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  
  const errorMessage = errors[name]?.message as string;

  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={name} className="block text-[13px] font-medium text-zinc-300 mb-1.5">
        {label}
      </label>
      <Input
        id={name}
        {...register(name)}
        {...props}
        className={cn(errorMessage && "border-red-500 focus:border-red-500 focus:ring-red-500")}
      />
      {errorMessage && <p className="text-xs text-red-500 mt-1">{errorMessage}</p>}
    </div>
  );
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  name: string;
  label: string;
  options: { label: string; value: string }[];
}

export function FormSelect({ name, label, options, className, ...props }: FormSelectProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  
  const errorMessage = errors[name]?.message as string;

  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={name} className="block text-[13px] font-medium text-zinc-300 mb-1.5">
        {label}
      </label>
      <select
        id={name}
        {...register(name)}
        {...props}
        className={cn(
          "w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[13px] text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all",
          errorMessage && "border-red-500 focus:border-red-500 focus:ring-red-500",
          className
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {errorMessage && <p className="text-xs text-red-500 mt-1">{errorMessage}</p>}
    </div>
  );
}
