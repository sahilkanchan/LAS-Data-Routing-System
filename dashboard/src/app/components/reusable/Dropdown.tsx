'use client';

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'

import { DropdownOption } from '../../lib/components/dropdown';
// import { SetStateAction, Dispatch } from 'react';

type onChangeHandler = (option: DropdownOption) => void

interface DropdownProps {
  options: DropdownOption[],
  selected: DropdownOption,
  onChange: onChangeHandler
}

const Dropdown = ({ options, selected, onChange }: DropdownProps) => {
  return (
    <div>
      <Listbox value={selected} onChange={onChange} by="label">
        <ListboxButton
          className={clsx(
            'relative block rounded-md bg-white/40 border border-gray-300 py-1.5 pr-8 pl-3 text-left text-sm/6',
            'focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25'
          )}
        >
          {selected.label}
          <ChevronDownIcon
            className="group pointer-events-none absolute top-2.5 right-2.5 size-4"
            aria-hidden="true"
          />
        </ListboxButton>
        <ListboxOptions
          anchor="bottom end"
          transition
          className={clsx(
            'w-42 mt-1 rounded-md border border-gray-200 bg-white shadow-sm p-1 focus:outline-none',
            'transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0'
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

export default Dropdown;