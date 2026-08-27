import { NonNullableObj } from "@/app/types/main"

export interface DropdownOption {
  label: string,
  data: NonNullableObj
}

type LabelLambda<D> = (option: D) => string

export function createDropdownOptions<D extends NonNullableObj>(
  options: D[],
  label: LabelLambda<D>
): DropdownOption[] {
  return options.map((option) => {
    return {
      label: label(option),
      data: option
    }
  })
}

export function createSelectedOption<D extends NonNullableObj>(selected: D, label: LabelLambda<D>): DropdownOption {
  return {
    label: label(selected),
    data: selected
  }
}