// Mascaras de input para campos brasileiros.
// Cada funcao recebe o valor cru e devolve o valor formatado, descartando
// caracteres invalidos. Use no onChange dos inputs.

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** Aplica mascara de CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00). */
export function maskCpfCnpj(value: string): string {
  const d = onlyDigits(value).slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/** Aplica mascara de telefone fixo (00) 0000-0000 ou celular (00) 00000-0000. */
export function maskPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 10) {
    return d
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return d
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

/** Aplica mascara de CEP (00000-000). */
export function maskCep(value: string): string {
  return onlyDigits(value).slice(0, 8).replace(/(\d{5})(\d{1,3})$/, '$1-$2');
}

/**
 * Mascara de valor monetario (pt-BR). Trata o que foi digitado como centavos,
 * formatando da direita para a esquerda: "123456" -> "1.234,56".
 */
export function maskCurrency(value: string): string {
  const digits = onlyDigits(value).slice(0, 13); // ate ~9 bilhoes
  if (!digits) return '';
  return (Number(digits) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Converte um numero (ou string numerica) para a mascara "1.234,56". */
export function currencyToMask(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (n == null || Number.isNaN(n)) return '';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Converte um valor mascarado ("1.234,56") de volta para number (1234.56). */
export function parseCurrency(value: string): number {
  const digits = onlyDigits(value);
  return digits ? Number(digits) / 100 : 0;
}
