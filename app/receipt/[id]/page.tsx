"use client";
import { string } from "@schematichq/schematic-typescript-node/core/schemas";
import { useParams } from "next/navigation";
import React from "react";

function Receipt() {
  const params = useParams<{ id: string }>();

  return <div>page</div>;
}

export default Receipt;
