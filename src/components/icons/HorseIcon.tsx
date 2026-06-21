import type { SVGProps } from 'react';

interface HorseIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

/**
 * Icone de cavalo no estilo de traco do lucide (currentColor).
 * Desenho do Tabler Icons (MIT), ja que o lucide nao possui um cavalo.
 */
export function HorseIcon({ size = 24, strokeWidth = 2, ...props }: HorseIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 10l-.85 8.507a1.357 1.357 0 0 0 1.35 1.493h.146a2 2 0 0 0 1.857 -1.257l.994 -2.486a2 2 0 0 1 1.857 -1.257h1.292a2 2 0 0 1 1.857 1.257l.994 2.486a2 2 0 0 0 1.857 1.257h.146a1.37 1.37 0 0 0 1.364 -1.494l-.864 -9.506h-8c0 -3 -3 -5 -6 -5l-3 6l2 2l3 -2" />
      <path d="M22 14v-2a3 3 0 0 0 -3 -3" />
    </svg>
  );
}
