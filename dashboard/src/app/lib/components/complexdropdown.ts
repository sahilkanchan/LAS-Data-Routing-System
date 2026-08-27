// import { NonNullableObj } from "@/app/types/main"
import React from "react";

export interface ComplexDropdownOption<D> {
  id: number;
  label: React.ReactElement | string;
  data: D
}

type OptionLambda<D> = (option: D, idx: number) => React.ReactElement | string
///export type MultiOrSingleSelectOption = ComplexDropdownOption<D>[]
export type SelectedOptionProp<D> = { selected: ComplexDropdownOption<D>[] }

export function createComplexDropdownOptions<D>(
  options: D[],
  display: OptionLambda<D>
): ComplexDropdownOption<D>[] {
  return options.map((option, idx) => {
    return {
      id: idx,
      label: display(option, idx),
      data: option
    }
  })
}

// export function createSelectedOption<D extends NonNullableObj>(selected: D, label: OptionLambda<D>): ComplexDropdownOption {
//   return {
//     label: label(selected),
//     data: selected
//   }
// }