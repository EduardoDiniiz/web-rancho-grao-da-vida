import type { ReactNode, FormEvent } from 'react';
import './FormCard.css';

interface FormCardProps {
  children: ReactNode;
  onSubmit: () => void;
  submitLabel?: string;
  loading?: boolean;
  onCancel?: () => void;
}

export function FormCard({ children, onSubmit, submitLabel = 'Salvar', loading, onCancel }: FormCardProps) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div className="form-card__body">{children}</div>
      <div className="form-card__footer">
        {onCancel && (
          <button type="button" className="form-card__btn form-card__btn--cancel" onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button type="submit" className="form-card__btn form-card__btn--submit" disabled={loading}>
          {loading ? 'Salvando...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function FormRow({ children }: { children: ReactNode }) {
  return <div className="form-card__row">{children}</div>;
}
