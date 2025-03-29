import {v} from "convex/values"
import {mutation, query} from "./_generated/server"

// function to generate convex upoad url for client
export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    }
})

// store a receipt and add it to the db
export const storeReceipt = mutation({
    args: {
        userId: v.string(),
        fileId: v.id("_storage"),
        fileName: v.string(),
        size: v.number(),
        mimeType: v.string(),
    },
    handler: async (ctx, args) => {
        // save receipt to the db
        const receiptId = await ctx.db.insert("receipts", {
            userId: args.userId,
            fileName: args.fileName,
            fileId: args.fileId,
            uploadedAt: Date.now(),
            size: args.size,
            mimeType: args.mimeType,
            status: "pending",
            // init extracted datafields as null
            merchantName: undefined,
            merchantAddress: undefined,
            merchantContact: undefined,
            transactionDate: undefined,
            transactionAmount: undefined,
            currency: undefined,
            items: [],
        })

        return receiptId
    }
})


// function to get all receipts
export const getReceipts = query({
    args: {
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
        .query("receipts")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .order("desc").collect();
    } 
})


// get receipt by id
export const getReceiptById = query({
    args: {
        id: v.id("receipts"),
    },
    handler: async (ctx, args) => {
        const receipt = await ctx.db.get(args.id);

        if (receipt) {
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) {
                throw new Error("Not authenticated!!")
            }

            const userId = identity.subject;
            if (receipt.userId !== userId) {
                throw new Error("Not authorized to access the receipt!")
            }
        }

        return receipt;
    }
})

// genrate url to download a receipt file
export const getReceiptDownloadUrl = query({
    args: {
        fileId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.fileId)
    }
})

// update receipt status
export const updateReceiptStatus = mutation({
    args: {
        id: v.id("receipts"),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        const receipt = await ctx.db.get(args.id);

        if (!receipt) {
            throw new Error("Receipt not found!")
        }

        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not Authenticated!")
        }

        const userId = identity.subject;
        if (receipt.userId !== userId) {
            throw new Error("Nt authorised to update this Receipt!")
        }

        await ctx.db.patch(args.id, {
            status: args.status,
        })

        return true
    }
})

// delete receipt
export const deleteReceipt = mutation({
    args: {
        id: v.id("receipts"),
    },
    handler: async (ctx, args) => {
        const receipt = await ctx.db.get(args.id);

        if (!receipt) {
            throw new Error("Receipt not found!")
        }

        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not Authenticated!")
        }

        const userId = identity.subject;
        if (receipt.userId !== userId) {
            throw new Error("Not authorised to delete this Receipt!")
        }

        await ctx.storage.delete(receipt.fileId)
        await ctx.db.delete(args.id)

        return true
    }
})

// update receipt with extracted data
export const updateReceiptWithExtractedData = mutation({
    args: {
        id: v.id("receipts"),
        fileDisplayName: v.string(),
        merchantName: v.string(),
        merchantAddress: v.string(),
        merchantContact: v.string(),
        transactionDate: v.string(),
        transactionAmount: v.string(),
        currency: v.string(),
        receiptSummary: v.string(),
        items: v.array(
            v.object({
                name: v.string(),
                quantity: v.number(),
                unitPrice: v.number(),
                totalPrice: v.number(),
            }),
        ),
    },
    handler: async (ctx, args) => {
        // Verify the receipt exists
        const receipt = await ctx.db.get(args.id);
        if (!receipt) {
            throw new Error("Receipt not found");
        }
    
        // Update the receipt with the extracted data
        await ctx.db.patch(args.id, {
            fileDisplayName: args.fileDisplayName,
            merchantName: args.merchantName,
            merchantAddress: args.merchantAddress,
            merchantContact: args.merchantContact,
            transactionDate: args.transactionDate,
            transactionAmount: args.transactionAmount,
            currency: args.currency,
            receiptSummary: args.receiptSummary,
            items: args.items,
            status: "processed", // Mark as processed now that we have extracted data
        });
    
        return {
            userId: receipt.userId,
        };
    }
    
    
})