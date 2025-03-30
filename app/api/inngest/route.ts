import {serve} from "inngest/next";
import { inngest } from "@/inngest/client";
import { extractAndSavePDF } from "@/inngest/agent";

// api that serves zero functions
export const {GET, POST, PUT} = serve({
    client: inngest,
    functions: [
        // functions will be passed here.
        extractAndSavePDF
    ],
})