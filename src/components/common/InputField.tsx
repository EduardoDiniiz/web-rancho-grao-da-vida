import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import './InputField.css';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function InputField({ label, error, ...props }: InputFieldProps) {
  return (
    <div className="input-field">
      <label className="input-field__label">{label}</label>
      <input className={`input-field__input ${error ? 'input-field__input--error' : ''}`} {...props} />
      {error && <span className="input-field__error">{error}</span>}
    </div>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
  placeholder?: string;
}

export function SelectField({ label, options, error, placeholder, ...props }: SelectFieldProps) {
  return (
    <div className="input-field">
      <label className="input-field__label">{label}</label>
      <select className={`input-field__input ${error ? 'input-field__input--error' : ''}`} {...props}>
        <option value="">{placeholder ?? 'Selecione...'}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span className="input-field__error">{error}</span>}
    </div>
  );
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function TextareaField({ label, error, ...props }: TextareaFieldProps) {
  return (
    <div className="input-field">
      <label className="input-field__label">{label}</label>
      <textarea
        className={`input-field__input input-field__textarea ${error ? 'input-field__input--error' : ''}`}
        rows={3}
        {...props}
      />
      {error && <span className="input-field__error">{error}</span>}
    </div>
  );
}
