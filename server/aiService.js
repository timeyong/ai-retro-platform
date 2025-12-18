const { GoogleGenAI } = require("@google/genai");

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TEXT_MODEL = "gemini-3-pro-preview";
const IMAGE_MODEL = "gemini-3-pro-image-preview";

// JSON schema for structured retro analysis output
const RETRO_ANALYSIS_SCHEMA = {
    type: "object",
    properties: {
        summary: {
            type: "string",
            description: "A concise summary including: overall sentiment, key themes from what went well, key areas for improvement, and 2-3 suggestedaction items"
        },
        imagePrompt: {
            type: "string",
            description: "An image prompt featuring simple STICK FIGURE CHARACTERS representing team members. The stick figures should show emotions and activities that reflect the TRUE team sentiment. Use body language, poses, and simple props to convey the team vibe. NOT overly positive or cheerful if there are significant issues."
        },
        sentiment: {
            type: "object",
            properties: {
                overall: {
                    type: "string",
                    enum: ["positive", "negative", "mixed", "neutral"]
                },
                positiveRatio: {
                    type: "number",
                    description: "Ratio of positive sentiment from 0.0 to 1.0"
                },
                keyEmotions: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-3 key emotions reflected in the feedback"
                }
            },
            required: ["overall", "positiveRatio", "keyEmotions"]
        }
    },
    required: ["summary", "imagePrompt", "sentiment"]
};

/**
 * Analyze retro items using Gemini 3 Pro with structured output
 * Returns both summary and image prompt in one call
 * @param {Array} items - Array of retro items { id, type, content }
 * @returns {Promise<{summary: string, imagePrompt: string, sentiment: object}>}
 */
async function analyzeRetro(items) {
    if (!items || items.length === 0) {
        return {
            summary: "No items to summarize yet.",
            imagePrompt: null,
            sentiment: { overall: "neutral", positiveRatio: 0.5, keyEmotions: [] }
        };
    }

    // Prepare full context with all items (including likes count)
    const formatItem = (item) => {
        const likesText = item.likes > 0 ? ` [👍 ${item.likes} likes]` : '';
        return `- ${item.content}${likesText}`;
    };

    const wentWell = items.filter((i) => i.type === "good");
    const toImprove = items.filter((i) => i.type === "bad");
    const feedback = items.filter((i) => i.type === "feedback");

    const prompt = `You are a retrospective facilitator analyzing team feedback. Be HONEST and REALISTIC in your analysis.
    We are from SCG Digital Office.
    The current Retro is About "AI Day" which our team has one booth to show case our AI products and one work shop and one speaker stage at the event.
    The work consist of many parts.
    Our products are
    AI Factory: AI platform for SCG
    SARA: Which is meeting Summarization
    FlexOCR: Is a OCR for flexible output
    R-Guard: Which is Responsible AI product
    AI Agentic Chatbot: Which is AI chatbot service
IMPORTANT: Write ALL summary text in THAI language. The imagePrompt MUST be in English for the image generator.

NOTE: Items with more likes indicate stronger team agreement. Weight these items more heavily in your analysis.

**สิ่งที่ดี (${wentWell.length} รายการ):**
${wentWell.length > 0 ? wentWell.map(formatItem).join("\n") : "- ไม่มีรายการ"}

**สิ่งที่ต้องปรับปรุง (${toImprove.length} รายการ):**
${toImprove.length > 0 ? toImprove.map(formatItem).join("\n") : "- ไม่มีรายการ"}

**ข้อเสนอแนะ (${feedback.length} รายการ):**
${feedback.length > 0 ? feedback.map(formatItem).join("\n") : "- ไม่มีรายการ"}

Based on ALL the above content, provide:
1. A summary of the feedback in markdown format - MUST BE IN THAI LANGUAGE (ภาษาไทย)
2. An image prompt featuring Cartoonish STICK FIGURE CHARACTERS representing the team (MUST BE IN ENGLISH):
   - Create a scene with 4-6 simple stick figure characters representing team members
   - Use body language, facial expressions (simple dots/lines), and poses to show emotions
   - Include simple props related to the feedback themes (laptops, coffee, clocks, charts, etc.)
   - If there are serious issues: show some figures stressed or tired, not all celebrating
   - If things are mixed: show variety - some happy, some concerned
   - Only show celebration if feedback is genuinely positive
   - Style: Clean minimalist stick figures on a colored background, digital illustration style
   - The scene should tell a story about the team's current state
   - Make the scene relate to the feedbacks as much as possible
   - DO NOT be overly positive. Be realistic and neutral.
3. Sentiment analysis with the true overall mood and key emotions

DO NOT be overly positive. Be realistic and balanced. Remember: Summary in Thai, Image prompt in English.`;

    try {
        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: RETRO_ANALYSIS_SCHEMA,
            },
        });

        // Extract text from the response - handle different response structures
        let textContent;
        if (response.text) {
            textContent = response.text;
        } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
            textContent = response.candidates[0].content.parts[0].text;
        } else {
            throw new Error("Could not extract text from AI response");
        }

        const result = JSON.parse(textContent);
        console.log("[AI] Analysis complete. Sentiment:", result.sentiment.overall, "| Positive ratio:", result.sentiment.positiveRatio);
        return result;
    } catch (error) {
        console.error("Error analyzing retro:", error);
        return {
            summary: "Failed to generate summary. Please check API configuration.",
            imagePrompt: null,
            sentiment: { overall: "neutral", positiveRatio: 0.5, keyEmotions: [] }
        };
    }
}

/**
 * Generate a summary of retro items with sentiment analysis
 * @param {Array} items - Array of retro items
 * @returns {Promise<{summary: string, sentiment: object}>} - Summary and sentiment data
 */
async function generateSummary(items) {
    const analysis = await analyzeRetro(items);
    // Store the analysis for use by generateVibeImage
    generateSummary._lastAnalysis = analysis;
    return { summary: analysis.summary, sentiment: analysis.sentiment };
}

/**
 * Generate a "Team Vibe" image using Gemini 3 Pro Image
 * Uses the AI-generated prompt from analyzeRetro for realistic images
 * @param {Array} items - Array of retro items
 * @returns {Promise<string|null>} - Base64 encoded image or null on failure
 */
async function generateVibeImage(items) {
    if (!items || items.length === 0) {
        return null;
    }

    // Use the cached analysis from generateSummary, or generate new one
    let imagePrompt;
    if (generateSummary._lastAnalysis?.imagePrompt) {
        imagePrompt = generateSummary._lastAnalysis.imagePrompt;
        generateSummary._lastAnalysis = null; // Clear cache
    } else {
        // Fallback: run analysis if called independently
        const analysis = await analyzeRetro(items);
        imagePrompt = analysis.imagePrompt;
    }

    if (!imagePrompt) {
        console.log("[AI] No image prompt generated, skipping image generation");
        return null;
    }

    console.log("[AI] Generating image with prompt:", imagePrompt.substring(0, 100) + "...");

    try {
        const response = await ai.models.generateContent({
            model: IMAGE_MODEL,
            contents: imagePrompt,
            config: {
                aspectRatio: "16:9"
            }
        });

        // Extract image from response
        const imageParts = response.candidates?.[0]?.content?.parts?.filter(
            (part) => part.inlineData
        );

        if (imageParts && imageParts.length > 0) {
            return imageParts[0].inlineData.data; // Base64 encoded image
        }
        return null;
    } catch (error) {
        console.error("Error generating vibe image:", error);
        return null;
    }
}

module.exports = {
    analyzeRetro,
    generateSummary,
    generateVibeImage,
};
