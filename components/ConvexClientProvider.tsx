"use client";

import { ReactNode, useEffect } from "react";
import React from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth, useUser } from "@clerk/nextjs";
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
import {
  SchematicProvider,
  useSchematicEvents,
} from "@schematichq/schematic-react";

const SchematicWrapped = ({ children }: { children: React.ReactNode }) => {
  const { identify } = useSchematicEvents();
  const { user } = useUser();
  useEffect(() => {
    const username =
      user?.username ??
      user?.fullName ??
      user?.emailAddresses[0]?.emailAddress ??
      user?.id;

    if (user?.id) {
      identify({
        name: username,
        // user level keys
        keys: {
          id: user.id,
        },
        // company level keys
        company: {
          keys: {
            id: user.id, // we are using the same user id, because we are building a B2C app
          },
          name: username,
        },
      });
    }
  }, [user, identify]);

  return children;
};

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <SchematicProvider
        publishableKey={`${process.env.NEXT_PUBLIC_SCHEMATIC_KEY}`}
      >
        <SchematicWrapped>{children}</SchematicWrapped>
      </SchematicProvider>
    </ConvexProviderWithClerk>
  );
}
