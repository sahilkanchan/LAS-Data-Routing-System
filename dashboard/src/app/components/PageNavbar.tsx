'use client';

import { usePathname, useRouter } from "next/navigation";

import Icon from "./reusable/Icon";

import { navLinks } from "@/app/constants/routes";

const PageNavbar = () => {
  // Get active url pathname.
  const currPathname = usePathname()

  // Dynamic routing for state preservation.
  const router = useRouter();
  function goToPage(href: () => string) {
    if (href) {
      router.push(href());
    }
  }

  return (
    <div className="flex w-full items-center space-x-4 justify-center p-2">
      {Object.entries(navLinks).map(([path, { name, icon, href}], idx) => (
        <button
          key={idx}
          onClick={() => goToPage(href)}
          className={`flex items-center space-x-1 py-1 px-2 hover:bg-gray-200 active:bg-gray-300 rounded-md ${currPathname === path ? 'bg-gray-200' : ''}`}
        >
          <span><Icon IconComponent={icon} className="w-5 h-5" /></span>
          <span>{name}</span>
        </button>
      ))}
    </div>
  )
}

export default PageNavbar;
