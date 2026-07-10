"use client";

import dynamic from "next/dynamic";

export const Navbar = dynamic(() => import("./Navbar"), { ssr: false });
