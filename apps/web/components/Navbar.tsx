"use client";

import Icon from "@/public/icon";
import Link from "next/link";
import { useEffect, useState } from "react";

export function Navbar() {
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      setToken(token);
    }
  }, [token]);

  let links;

  if (token) {
    links = [
      { title: "Logout", link: "/logout", primary: false },
      { title: "Dashboard", link: "/dashboard", primary: true },
    ];
  } else {
    links = [
      {
        title: "Log In",
        link: "/login",
        primary: false,
      },
      { title: "Sign Up", link: "/signup", primary: true },
    ];
  }

  return (
    <nav className="z-20 sticky top-0 left-0 bg-white border border-b-black/10 p-2">
      <div className="max-w-7xl mx-auto flex w-full justify-between items-center">
        <div className="flex justify-center items-center gap-1">
          <Icon size="sm" />
          <Link href={"/"} className="font-medium text-sm md:text-md">
            ExceliDraw
          </Link>
        </div>
        <div className="flex justify-center items-center text-xs md:text-sm font-medium gap-3 text-black/70 hover:text-black">
          {links.map((link, index) => (
            <Link
              key={index}
              href={link.link}
              className={`${link.primary ? "bg-primary hover:bg-primary-dark text-white px-2 md:px-4 py-1 md:py-2 rounded-full" : "hover:underline"}`}
            >
              {link.title}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}