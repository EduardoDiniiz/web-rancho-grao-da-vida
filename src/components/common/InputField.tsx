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

interface Option {
  value: string;
  label: string;
}

interface ButtonGroupProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  /** Quando true, clicar na opcao ja selecionada limpa a selecao (campos opcionais). */
  clearable?: boolean;
}

/** Grupo de botoes de selecao unica (substitui selects com poucas opcoes). */
export function ButtonGroup({ options, value, onChange, clearable }: ButtonGroupProps) {
  return (
    <div className="btn-group" role="group">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            className={`btn-group__btn ${active ? 'btn-group__btn--active' : ''}`}
            aria-pressed={active}
            onClick={() => onChange(clearable && active ? '' : opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

interface ButtonGroupFieldProps extends ButtonGroupProps {
  label: string;
  error?: string;
}

/** ButtonGroup com label e mensagem de erro, no padrao dos demais campos. */
export function ButtonGroupField({ label, error, ...rest }: ButtonGroupFieldProps) {
  return (
    <div className="input-field">
      <label className="input-field__label">{label}</label>
      <ButtonGroup {...rest} />
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
