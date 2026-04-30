"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import {
  applyDateMask,
  formatMaskedDate,
  parseMaskedDate,
} from "../../lib/date-mask"
import { Calendar } from "./calendar"
import { Field, FieldLabel } from "./field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "./input-group"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

export interface DatePickerInputProps {
  label?: string
  placeholder?: string
  /** Valor inicial no formato dd/MM/yyyy */
  defaultValue?: string
  /** Chamado sempre que o valor muda. `date` é undefined se a data for inválida */
  onChange?: (date: Date | undefined, masked: string) => void
}

export function DatePickerInput({
  label = "Data",
  placeholder = "dd/mm/aaaa",
  defaultValue = "",
  onChange,
}: DatePickerInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const pendingCursor = React.useRef<number | null>(null)

  const [open, setOpen] = React.useState(false)
  const [masked, setMasked] = React.useState(defaultValue)
  const [date, setDate] = React.useState<Date | undefined>(() =>
    parseMaskedDate(defaultValue),
  )
  const [month, setMonth] = React.useState<Date | undefined>(() =>
    parseMaskedDate(defaultValue),
  )

  // Aplica a posição do cursor após cada render (necessário pois React
  // reposiciona o cursor ao atualizar o value de um input controlado)
  React.useLayoutEffect(() => {
    if (pendingCursor.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(
        pendingCursor.current,
        pendingCursor.current,
      )
      pendingCursor.current = null
    }
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { masked: next, cursor } = applyDateMask(e.target.value, masked)
    pendingCursor.current = cursor
    setMasked(next)

    const parsed = parseMaskedDate(next)
    setDate(parsed)
    if (parsed) setMonth(parsed)
    onChange?.(parsed, next)
  }

  function handleCalendarSelect(selected: Date | undefined) {
    const next = formatMaskedDate(selected)
    setDate(selected)
    setMasked(next)
    if (selected) setMonth(selected)
    setOpen(false)
    onChange?.(selected, next)
  }

  return (
    <Field className="mx-auto w-48">
      <FieldLabel htmlFor="date-input">{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          ref={inputRef}
          id="date-input"
          value={masked}
          placeholder={placeholder}
          inputMode="numeric"
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setOpen(true)
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <InputGroupButton
                id="date-picker"
                variant="ghost"
                size="icon-xs"
                aria-label="Selecionar data"
              >
                <CalendarIcon className="h-4 w-4" />
                <span className="sr-only">Selecionar data</span>
              </InputGroupButton>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="end"
              alignOffset={-8}
              sideOffset={10}
            >
              <Calendar
                mode="single"
                selected={date}
                month={month}
                onMonthChange={setMonth}
                onSelect={handleCalendarSelect}
              />
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}
