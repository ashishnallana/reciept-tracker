import { getTemporaryAccessToken } from "@/actions/getTemporaryActionToken";
import SchematicEmbed from "./SchematicEmbed";
import React from "react";

async function SchematicComponent({ componentId }: { componentId: string }) {
  if (!componentId) {
    return null;
  }

  const accessToken = await getTemporaryAccessToken();
  if (!accessToken) {
    throw new Error("no access token found for user!");
  }

  return <SchematicEmbed accessToken={accessToken} componentId={componentId} />;
}

export default SchematicComponent;
