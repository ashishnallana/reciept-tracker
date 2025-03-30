import { anthropic, createAgent, createTool, openai } from "@inngest/agent-kit";
import { gemini } from "inngest";
import { z } from "zod";


async function fetchPdfAsBase64(pdfUrl: string): Promise<string> {
    const response: Response = await fetch(pdfUrl);
    const arrayBuffer: ArrayBuffer = await response.arrayBuffer();
    const uint8Array: Uint8Array = new Uint8Array(arrayBuffer);

    // Convert Uint8Array to Base64
    const base64String: string = btoa(String.fromCharCode(...uint8Array));

    return base64String;
}

const parsePdfTool = createTool({
    name: "parse-pdf",
    description: "Analyzes the given PDF",
    parameters: z.object({
        pdfUrl: z.string(),
    }),
    handler: async ({pdfUrl}, {step}) => {



        try {

            const base64Pdf = await fetchPdfAsBase64(pdfUrl)

            return await step?.ai.infer("parse-pdf", {
                // model: anthropic({
                //     model: "claude-3-5-sonnet-20241022",
                //     defaultParameters: {
                //         max_tokens: 3094,
                //     }
                // }),
                
                model: gemini({
                    model: "gemini-2.5-pro-exp-03-25",
                }),
                body: {
                    contents: [
                        {
                            role: "user",
                            parts: [  
                                {
                                    inlineData: {  // Corrected this part
                                        mimeType: "application/pdf", // Specify the correct MIME type
                                        data: base64Pdf // If using a URL, this should be handled differently
                                    }
                                },
                                {
                                    text: `Extract the data from the receipt and return the structured output as follows:
                                    {
                                        "merchant": {
                                            "name": "Store Name",
                                            "address": "123 Main St, City, Country",
                                            "contact": "+123456789"
                                        },
                                        "transaction": {
                                            "date": "YYYY-MM-DD",
                                            "receipt_number": "ABC123456",
                                            "payment_method": "Credit Card"
                                        },
                                        "items": [
                                            {
                                                "name": "Item 1",
                                                "quantity": 2,
                                                "unit_price": 10.00,
                                                "total_price": 20.00
                                            }
                                        ],
                                        "totals": {
                                            "subtotal": 20.00,
                                            "tax": 2.00,
                                            "total": 22.00,
                                            "currency": "USD"
                                        }
                                    }`
                                }
                            ]
                        }
                    ]
                },
            })
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : "Unknown error",
            }
        }
        
    }
})

export const receiptScanningAgent = createAgent({
    name: "Receipt Scanning Agent",
    description:
        "Processes receipt images and PDFs to extract key information such as vendor names, dates, amounts, and line items",
    system: `You are an AI-powered receipt scanning assistant. Your primary role is to accurately extract and structure relevant information from scanned receipts. Your task includes recognizing and parsing details such as:
    • Merchant Information: Store name, address, contact details
    • Transaction Details: Date, time, receipt number, payment method
    • Itemized Purchases: Product names, quantities, individual prices, discounts
    • Total Amounts: Subtotal, taxes, total paid, and any applied discounts
    • Ensure high accuracy by detecting OCR errors and correcting misread text when possible.
    • Normalize dates, currency values, and formatting for consistency.
    • If any key details are missing or unclear, return a structured response indicating incomplete data.
    • Handle multiple formats, languages, and varying receipt layouts efficiently.
    • Maintain a structured JSON output for easy integration with databases or expense tracking systems.
    `,
    // model: openai({
    //     model: "gpt-4o-mini",
    //     defaultParameters:{
    //         max_completion_tokens: 3094,
    //     },
    // }),
    model: gemini({
        model: "gemini-2.0-flash",
    }),
    tools: [parsePdfTool],
});
