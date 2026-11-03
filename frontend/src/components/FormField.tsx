import React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormFieldProps = Omit<React.ComponentProps<typeof Input>, "id" | "value" | "aria-invalid"> & {
  /**
   * input 要素の id。vanilla-autokana が DOM id で要素を探すため、
   * 呼び出し側が指定した値をそのまま input に付ける（変更するとふりがな自動入力が壊れる）
   */
  id: string;
  label: string;
  value: string;
  /** 入力エラー表示にする */
  error?: boolean;
};

/**
 * ラベル付きのテキスト入力欄
 */
const FormField: React.FC<FormFieldProps> = ({ id, label, value, error, required, className, ...props }) => (
  <div className="grid gap-2">
    <Label htmlFor={id}>
      {label}
      {required && (
        <span className="text-destructive" aria-hidden>
          *
        </span>
      )}
    </Label>
    <Input
      id={id}
      value={value}
      required={required}
      aria-invalid={error || undefined}
      className={className}
      {...props}
    />
  </div>
);

export default FormField;
