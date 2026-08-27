'use client';
import { useState } from "react";

import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Icon from "@/app/components/reusable/Icon";

interface DividerSectionProps {
  sectionTitle: string,
  children: Readonly<React.ReactNode>
}

const DividerSection = ({ sectionTitle, children }: DividerSectionProps) => {
  const [chevronOpen, setChevronOpen] = useState(true)

  return (
    <div className="flex flex-col w-full space-y-2">
      <div onClick={() => setChevronOpen(!chevronOpen)} className="flex w-full items-center justify-between border-b border-gray-200 cursor-pointer selection:bg-none">
        <span className="flex items-center space-x-1">
          <span>
            <Icon IconComponent={chevronOpen ? ChevronDownIcon : ChevronRightIcon} className="w-4 h-4" />
          </span>
          <h3 className="text-lg">{sectionTitle}</h3>
        </span>
        <span className="text-sm">
          <p>{!chevronOpen ? 'Expand' : 'Hide'}</p>
        </span>
      </div>
      {
        chevronOpen &&
        <div>
          {children}
        </div>
      }
    </div>
  )
}

export default DividerSection;
