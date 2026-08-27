'use client';

import { usePathname } from "next/navigation";

import Icon from "./reusable/Icon";

import { navLinks } from "../constants/routes";
import { NavigationMeta } from "../types/main";

import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

// for unknown routes, using a default name/icon pair.
// JS proxies are also good for this kind of thing: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
function safeNavLinkFetch(pathName: string): NavigationMeta {
  return navLinks[pathName] || { name: '---', icon: QuestionMarkCircleIcon }
}

const NavbarCenter = () => {
  'use client';

  const currPathName = usePathname();
  const { name, icon } = safeNavLinkFetch(currPathName)
  return (
    <>
      <div className="flex justify-center items-center">
        <span className="flex space-x-2 items-center">
          <span>
            <Icon IconComponent={icon} className="w-5 h-5"/>
          </span>
          <h2 className="text-xl font-semibold">{ name }</h2>
        </span>
      </div>
    </>
  )
}

export default NavbarCenter;