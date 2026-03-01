"use client";

import { Menu, Button } from "antd";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { key: "/", label: <Link href="/">Home</Link> },
  { key: "/about", label: <Link href="/about">About</Link> },
  { key: "/packages", label: <Link href="/packages">Packages</Link> },
  { key: "/shop", label: <Link href="/shop">Shop</Link> },
  { key: "/events", label: <Link href="/events">Events</Link> },
  { key: "/contact", label: <Link href="/contact">Contact us</Link> },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="w-full bg-black px-6 md:px-12">
      <div className="mx-auto flex min-h-[88px] w-full max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/Header_Logo.png"
            alt="Logo"
            width={150}
            height={52}
            priority
            className="object-contain"
          />
        </Link>

        <div className="hidden flex-1 justify-center md:flex">
          <Menu
            mode="horizontal"
            selectedKeys={[pathname]}
            items={menuItems}
            theme="dark"
            style={{ background: "transparent", borderBottom: "none" }}
          />
        </div>

        <Link href="/get-started" className="shrink-0">
          <Button type="primary" shape="round" size="large">
            Get Started
          </Button>
        </Link>
      </div>
    </header>
  );
}
