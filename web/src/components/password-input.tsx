"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";

export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-input">
      <input {...props} type={visible ? "text" : "password"} />
      <button type="button" className="icon-button" aria-label={visible ? "Hide password" : "Show password"} aria-controls={props.id} aria-pressed={visible} onClick={() => setVisible(!visible)}>
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
