// Validadores reaproveitaveis. Cada `validate*` devolve uma mensagem de erro
// (string) ou `undefined` quando o valor e valido. Campos opcionais vazios
// retornam `undefined` - combine com `required` quando obrigatorio.

import { onlyDigits, parseCurrency } from './masks';

export function required(value: string | null | undefined, label = 'Campo'): string | undefined {
  return value != null && String(value).trim() !== '' ? undefined : `${label} e obrigatorio.`;
}

export function isValidCpf(cpf: string): boolean {
  const d = onlyDigits(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}

export function isValidCnpj(cnpj: string): boolean {
  const d = onlyDigits(cnpj);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (weights: number[]) => {
    const sum = weights.reduce((acc, w, i) => acc + Number(d[i]) * w, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  const d1 = calc([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calc([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === Number(d[12]) && d2 === Number(d[13]);
}

export function validateCpfCnpj(value: string): string | undefined {
  if (!value || !value.trim()) return undefined; // opcional
  const d = onlyDigits(value);
  if (d.length === 11) return isValidCpf(d) ? undefined : 'CPF invalido.';
  if (d.length === 14) return isValidCnpj(d) ? undefined : 'CNPJ invalido.';
  return 'CPF/CNPJ incompleto.';
}

export function validateEmail(value: string, opts?: { requiredMsg?: string }): string | undefined {
  if (!value || !value.trim()) return opts?.requiredMsg;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? undefined : 'E-mail invalido.';
}

export function validatePhone(value: string): string | undefined {
  if (!value || !value.trim()) return undefined; // opcional
  const len = onlyDigits(value).length;
  return len === 10 || len === 11 ? undefined : 'Telefone invalido.';
}

export function validatePositiveNumber(value: string, label = 'Valor'): string | undefined {
  if (value == null || String(value).trim() === '') return `${label} e obrigatorio.`;
  const n = Number(value);
  if (Number.isNaN(n)) return `${label} invalido.`;
  return n > 0 ? undefined : `${label} deve ser maior que zero.`;
}

/** Valida um campo de valor monetario mascarado ("1.234,56"). */
export function validatePositiveCurrency(value: string, label = 'Valor'): string | undefined {
  if (!value || !value.trim()) return `${label} e obrigatorio.`;
  return parseCurrency(value) > 0 ? undefined : `${label} deve ser maior que zero.`;
}

/** Extrai o mapa de erros por campo de uma resposta de erro da API (400). */
export function fieldErrorsFromApi(err: any): Record<string, string> {
  const data = err?.response?.data;
  return data?.errors && typeof data.errors === 'object' ? data.errors : {};
}
