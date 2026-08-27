'use client';

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'

import { ComplexDropdownOption, SelectedOptionProp } from '@/app/lib/components/complexdropdown';

type onChangeHandler<D> = (option: ComplexDropdownOption<D>[]) => void
type SelectedLabelComponent<D> = (props: SelectedOptionProp<D>) => React.ReactElement;

interface ComplexDropdownProps<D> {
  buttonClassName?: string;
  optionsClassName?: string;
  optionsAnchor?: string;
  multiSelect?: boolean;
  options: ComplexDropdownOption<D>[];
  selected: ComplexDropdownOption<D>[]; // multi or single select.
  selectedLabel?: SelectedLabelComponent<D>; // optional: label component for selected option
  onChange: onChangeHandler<D>;
}


const ComplexDropdown = <D,>({ buttonClassName, optionsClassName, optionsAnchor, multiSelect, options, selected, selectedLabel, onChange }: ComplexDropdownProps<D>) => {
  const isMultiSelect = multiSelect ?? false
  const dynamicSelectable = isMultiSelect ? selected : selected[0]

  // callback guarantees a list selected to handler for ease of use.
  const handleChange = (selected: ComplexDropdownOption<D> | ComplexDropdownOption<D>[]) => {
    const normalized = Array.isArray(selected) ? selected : [selected]; // Always an array
    onChange(normalized);
  };

  return (
    <div>
      <Listbox value={dynamicSelectable} onChange={handleChange} by="id" multiple={!!multiSelect}>
        <ListboxButton
          className={clsx(
            buttonClassName ? buttonClassName : 'rounded-md bg-white/40 border border-gray-300 py-1.5 pr-8 pl-3 text-left text-sm/6',
            'relative block focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25'
          )}
        >
          {selectedLabel ? selectedLabel({ selected }) : selected.map((option) => option.label).join(', ')}
          <ChevronDownIcon
            className="group pointer-events-none absolute top-2.5 right-2.5 size-4"
            aria-hidden="true"
          />
        </ListboxButton>
        <ListboxOptions
          anchor={optionsAnchor === 'bottom start' ? 'bottom start' : 'bottom end'}
          transition
          className={clsx(
            optionsClassName ? optionsClassName : 'w-48 mt-1 rounded-md border border-gray-200 bg-white shadow-sm p-1 focus:outline-none', // defaults to second styling.
            'focus:outline-none transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0'
          )}
        >
          {options.map((option, idx) => (
            <ListboxOption
              key={idx}
              value={option}
              className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-gray-200/75"
            >
              <CheckIcon className="invisible size-4 group-data-[selected]:visible" />
              <div className="text-sm/6">{option.label}</div>
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Listbox>
    </div>
  )
}

export default ComplexDropdown;