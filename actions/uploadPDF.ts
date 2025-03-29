'use server'

import { api } from "@/convex/_generated/api";
import convex from "@/lib/convexClient";
import { currentUser } from "@clerk/nextjs/server"
import { getFileDownloadUrl } from "./getFileDownloadUrl";

// server action to upload pdf to convex storage

export async function uploadPDF(formData: FormData) {
    const user = await currentUser();

    if (!user) {
        return {success: false, error: "Not Authenticated!"}
    }

    try {
        // get the file form frmData
        const file = formData.get("file") as File;

        if (!file) {
            return {
                success: false,
                error: "No file provided!"
            }
        }

    // validate file type
    if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
        return {
            success: false,
            error: "Only PDF fies are allowed!"
        }
    }

    // get upload url from convex
    const uploadUrl = await convex.mutation(api.receipts.generateUploadUrl, {})
    // convert file to arr buffer for  fetch API
    const arrayBuffer = await file.arrayBuffer();
    // upload the file to convex
    const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
            "Content-Type": file.type,
        },
        body: new Uint8Array(arrayBuffer)
    })

    if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file : ${uploadResponse.statusText}`)
    }

    const {storageId} = await uploadResponse.json();

    // add receipt to db
    const receiptId = await convex.mutation(api.receipts.storeReceipt, {
        userId: user.id,
        fileId: storageId,
        fileName: file.name,
        size: file.size,
        mimeType: file.type,
    })

    // generate file url
    const fileUrl = await getFileDownloadUrl(storageId)

    // TODO: trigger inngest agent flow

    // **************************
        
    return {
        success: true,
        data: {
            receiptId,
            fileName: file.name,
            
        }
    }

    } catch (error) {
        console.error("Server action upload error:" , error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "An Unknown error occured!"
        }
    }
}