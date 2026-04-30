import { format, isValid, parse } from "date-fns"
import { ptBR } from "date-fns/locale"

export const DATE_MASK_PATTERN = "dd/MM/yyyy"

/**
 * Formata uma Date para string no padrão brasileiro `dd/MM/yyyy`.
 */
export function formatMaskedDate(date: Date | undefined | null): string {
  if (!date || !isValid(date)) return ""
  return format(date, DATE_MASK_PATTERN, { locale: ptBR })
}

/**
 * Faz parse de uma string `dd/MM/yyyy` para Date. Retorna `undefined` se a
 * string estiver incompleta ou representar uma data inválida (ex.: 32/01/2024).
 */
export function parseMaskedDate(masked: string): Date | undefined {
  if (!masked || masked.length < DATE_MASK_PATTERN.length) return undefined
  const parsed = parse(masked, DATE_MASK_PATTERN, new Date(), { locale: ptBR })
  return isValid(parsed) ? parsed : undefined
}

/**
 * Aplica máscara `dd/MM/yyyy` ao que o usuário digitou.
 *
 * - Ignora tudo que não for dígito
 * - Limita a 8 dígitos (ddmmaaaa)
 * - Insere as barras automaticamente
 * - Ao completar o slot do dia (2 dígitos) ou do mês (4 dígitos), adiciona a
 *   barra e retorna o cursor posicionado depois dela — desde que o usuário
 *   esteja digitando (não deletando)
 * - Auto-completa com zero à esquerda quando o primeiro dígito inviabiliza um
 *   número de 2 dígitos:
 *    · Dia começando com 4-9 → vira "04".."09" e salta para o mês (dias só vão até 31)
 *    · Mês começando com 2-9 → vira "02".."09" e salta para o ano (meses só vão até 12)
 */
export function applyDateMask(
  rawInput: string,
  prevMasked: string,
): { masked: string; cursor: number } {
  let digits = rawInput.replace(/\D/g, "").slice(0, 8)
  const prevDigits = prevMasked.replace(/\D/g, "")

  // Quando o usuário apaga um separador "/", também remove o dígito antes dele
  if (digits.length === prevDigits.length && rawInput.length < prevMasked.length) {
    digits = digits.slice(0, -1)
  }

  const isDeleting = digits.length < prevDigits.length

  // Auto-zero-pad do dia quando o primeiro dígito > 3
  if (!isDeleting && digits.length === 1 && Number(digits[0]) > 3) {
    digits = "0" + digits
  }

  // Limita o dia a no máximo 31
  if (!isDeleting && digits.length >= 2 && digits[0] === "3" && Number(digits[1]) > 1) {
    digits = "31" + digits.slice(2)
  }

  // Auto-zero-pad do mês quando o primeiro dígito > 1
  if (!isDeleting && digits.length === 3 && Number(digits[2]) > 1) {
    digits = digits.slice(0, 2) + "0" + digits[2]
  }

  // Limita o mês a no máximo 12
  if (!isDeleting && digits.length >= 4 && digits[2] === "1" && Number(digits[3]) > 2) {
    digits = digits.slice(0, 2) + "12" + digits.slice(4)
  }

  let masked: string

  if (digits.length <= 2) {
    masked = digits
    if (!isDeleting && digits.length === 2) masked += "/"
  } else if (digits.length <= 4) {
    masked = `${digits.slice(0, 2)}/${digits.slice(2)}`
    if (!isDeleting && digits.length === 4) masked += "/"
  } else {
    masked = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
  }

  return { masked, cursor: masked.length }
}
