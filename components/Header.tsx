"use client";
import Link from "next/link";
import React from "react";
import { Shield } from "lucide-react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import { Button } from "./ui/button";
import { usePathname } from "next/navigation";

function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <div
      className={`p-4 flex justify-between items-center ${isHomePage ? "bg-blue-50" : "bg-white border-b border-blue-50"}`}
    >
      <Link href={"/"} className="flex items-center">
        <Shield className="w-6 h-6 text-blue-600 mr-2" />
        <h1>Expensio</h1>
      </Link>

      <div className="flex items-center space-x-4">
        {/* if user is logged in */}
        <SignedIn>
          <Link href={"/receipts"}>
            <Button variant={"outline"}>My Reciepts</Button>
          </Link>

          <Link href={"/manage-plan"}>
            <Button>Manage Plan</Button>
          </Link>

          <UserButton />
        </SignedIn>
        {/* if use is logged out */}
        <SignedOut>
          <SignInButton mode="modal">
            <Button>Login</Button>
          </SignInButton>
        </SignedOut>
      </div>
    </div>
  );
}

export default Header;
