'use client';

import Link from "next/link";
import Image from 'next/image';

const NavbarLeft = () => {
  return (
    <div className="pl-4 flex items-center">
      <Link href='/' className="flex items-center space-x-2 text-lg">
        <Image src="/LASLogoHome.png" alt="LAS Logo" width={50} height={50} />
        <h1>Dashboard</h1>
      </Link>
    </div>
  )
}

export default NavbarLeft;