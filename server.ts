import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase limit to receive audio base64 streams
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Pre-defined detailed sales call dataset for realistic platform demonstrations
const SAMPLES_DATA = {
  "tech-demo": {
    filename: "SaaS_Enterprise_Demo_Q3.mp3",
    title: "Enterprise HubSpot Migration Demo",
    duration: "4m 12s",
    analysis: {
      transcript: [
        { speaker: "Speaker A (Salesperson)", timestamp: "00:05", text: "Hi Sarah! Thanks for jumping on today. I'm excited to walk you through our automated data migration tools. How's your week going?", sentiment: 0.8 },
        { speaker: "Speaker B (Prospect)", timestamp: "00:15", text: "Hey David, doing well! Yes, we've been struggling with our manual CRM sync, so this call is very timely.", sentiment: 0.6 },
        { speaker: "Speaker A (Salesperson)", timestamp: "00:26", text: "I completely understand. It's normally a huge headache. Before we dive into the product, do you mind sharing how many custom deal pipelines you currently maintain in HubSpot?", sentiment: 0.7 },
        { speaker: "Speaker B (Prospect)", timestamp: "00:39", text: "We have about six different divisions, each with their own pipeline. Honestly, it's a mess. Half of the fields don't map over correctly when we try to sync them manually.", sentiment: -0.3 },
        { speaker: "Speaker A (Salesperson)", timestamp: "00:54", text: "Six pipelines is exactly our sweet spot. Our system auto-detects schema variations and maps them in under twenty seconds. Let me share my screen and show you what that look like.", sentiment: 0.9 },
        { speaker: "Speaker B (Prospect)", timestamp: "01:20", text: "Wow, that auto-mapping interface actually looks very simple. But what happens if some CRM fields are completely empty? Does it break the migration?", sentiment: 0.1 },
        { speaker: "Speaker A (Salesperson)", timestamp: "01:35", text: "Excellent question. No, it doesn't break at all. The platform defaults to a 'Hold & Notify' state. It isolates the faulty rows so the other 99% of your clean database migrates without stalling.", sentiment: 0.85 },
        { speaker: "Speaker B (Prospect)", timestamp: "01:55", text: "Ah, I see! That's a huge relief. Our last tool just crashed the whole run whenever it encountered an empty field, and we had to start from scratch.", sentiment: 0.8 },
        { speaker: "Speaker A (Salesperson)", timestamp: "02:10", text: "That is a nightmare scenario! That's exactly why we build the isolation logic. Now, on the pricing front, for an enterprise catalog like yours, it usually starts around $2,500 a month.", sentiment: 0.4 },
        { speaker: "Speaker B (Prospect)", timestamp: "02:28", text: "Oof. That is significantly higher than what we budgeted. We were looking at around $1,200 max. I'm not sure if I can get budget approval for that price point.", sentiment: -0.6 },
        { speaker: "Speaker A (Salesperson)", timestamp: "02:42", text: "I hear you. The sticker shock is real. But if you consider the engineering hours your team spends fixing migration errors, which is roughly 15 hours a week, you're actually saving closer to $4,000 monthly.", sentiment: 0.6 },
        { speaker: "Speaker B (Prospect)", timestamp: "03:02", text: "You make a fair point. The engineering cost is indeed a hidden drain. But still, can we start with a smaller plan and upgrade later as we roll out other pipelines?", sentiment: 0.3 },
        { speaker: "Speaker A (Salesperson)", timestamp: "03:15", text: "Absolutely, we can tailor a starter tier for three pipelines at $1,400. That way, you prove the ROI first. I can send over that custom contract proposal by this afternoon. What do you say?", sentiment: 0.8 },
        { speaker: "Speaker B (Prospect)", timestamp: "03:32", text: "That sounds much more manageable. Send that over, and I will review it with our VP tomorrow morning.", sentiment: 0.7 },
        { speaker: "Speaker A (Salesperson)", timestamp: "03:45", text: "Perfect! I will send that over in an hour, along with a migration checklist. Thanks for your time, Sarah, talk soon!", sentiment: 0.9 },
        { speaker: "Speaker B (Prospect)", timestamp: "03:58", text: "Thanks David, appreciate the flexibility. Goodbye!", sentiment: 0.8 }
      ],
      sentimentTimeline: [
        { timestamp: "00:00", engagementSalesperson: 75, engagementProspect: 50, topic: "Introductions & Warm-up" },
        { timestamp: "00:30", engagementSalesperson: 80, engagementProspect: 45, topic: "Needs Discovery" },
        { timestamp: "01:00", engagementSalesperson: 90, engagementProspect: 55, topic: "SaaS Platform Walkthrough" },
        { timestamp: "01:30", engagementSalesperson: 85, engagementProspect: 65, topic: "Technical Q&A" },
        { timestamp: "02:00", engagementSalesperson: 80, engagementProspect: 75, topic: "Demo Validation" },
        { timestamp: "02:30", engagementSalesperson: 60, engagementProspect: 30, topic: "Pricing Objection" },
        { timestamp: "03:00", engagementSalesperson: 75, engagementProspect: 55, topic: "ROI Recalculation" },
        { timestamp: "03:30", engagementSalesperson: 85, engagementProspect: 75, topic: "Negotiated Agreement" },
        { timestamp: "04:00", engagementSalesperson: 90, engagementProspect: 80, topic: "Action Steps & Wrap-up" }
      ],
      coaching: {
        strengths: [
          "Outstanding discovery phase: David asked insightful questions about custom pipelines instead of immediately pitching the software.",
          "Brilliant framing of objections: Reframed the software price from 'expense' to 'saved engineering hours' by showing they recover 15 hours/week.",
          "Excellent situational flexibility: Instantly proposed a modular 3-pipeline plan for $1,400 to match Sarah's budget guidelines."
        ],
        missedOpportunities: [
          "Failed to establish clear follow-up calendar event: David simply said he will email the proposal instead of booking the VP meeting on the call.",
          "Missed exploring prospect's wider ecosystem: Didn't ask if Sarah uses other platforms besides HubSpot that might benefit from migration.",
          "Could have introduced customer proof cases: Mentioning a similar company that migrated pipelines successfully would have reduced security concerns sooner."
        ],
        overallScore: 84,
        summary: "David ran an extremely professional discovery-led product demo. He listened intently and let the prospect guide the technical pain points before presenting solutions. While his objection handling on pricing was strong, he did not securely lock down a firm follow-up appointment, potentially leaving the deal vulnerable to stalling.",
        keyMetrics: {
          talkRatioSales: 58,
          objectionHandling: 88,
          needsDiscovery: 92,
          closingAttempt: 78
        }
      }
    }
  },
  "product-inquiry": {
    filename: "Inbound_Lead_Retail_API.mp3",
    title: "Retail Inventory API Inquiry",
    duration: "3m 24s",
    analysis: {
      transcript: [
        { speaker: "Speaker A (Salesperson)", timestamp: "00:02", text: "Thanks for calling StockFlow Support & Sales. My name is Alex. How can I assist you today?", sentiment: 0.7 },
        { speaker: "Speaker B (Prospect)", timestamp: "00:10", text: "Hi, I'm the lead engineer at a boutique fashion chain. We need an API that can sync multi-store inventory levels in real-time. What are your rate limits?", sentiment: 0.5 },
        { speaker: "Speaker A (Salesperson)", timestamp: "00:22", text: "Great! We have the fastest API on the market. Our rate limit is 50,000 requests per minute on the scaling tier, which has 99.99% uptime. It's a RESTful interface built on robust Edge servers.", sentiment: 0.9 },
        { speaker: "Speaker B (Prospect)", timestamp: "00:40", text: "Okay, 50k is good. But how do you handle webhook retries when our receiving server is briefly down?", sentiment: 0.4 },
        { speaker: "Speaker A (Salesperson)", timestamp: "00:52", text: "Oh, we have an automatic retrying mechanism. It retries five times on an exponential backoff. Also we have a gorgeous dashboard that shows latency graphs, server response logs, and telemetry.", sentiment: 0.8 },
        { speaker: "Speaker B (Prospect)", timestamp: "01:14", text: "I see. Is that dashboard mobile responsive? Our warehouse managers need to monitor sync status on Android tablets.", sentiment: 0.6 },
        { speaker: "Speaker A (Salesperson)", timestamp: "01:22", text: "Yes, it is perfectly optimized for tablets! In fact, we are fully cloud-native, running on managed Kubernetes nodes to handle peak traffic during Black Friday Sales.", sentiment: 0.8 },
        { speaker: "Speaker B (Prospect)", timestamp: "01:40", text: "Got it. What about the onboarding timeline? We need to go live before our summer season begins in exactly four weeks.", sentiment: 0.3 },
        { speaker: "Speaker A (Salesperson)", timestamp: "01:54", text: "Four weeks is quite tight, but if your developer team checks out our developer playground, they can generate custom SDK keys in ten seconds. It takes most teams about two to three weeks to wrap construction.", sentiment: 0.7 },
        { speaker: "Speaker B (Prospect)", timestamp: "02:18", text: "Three weeks makes it very close. Do you offer an integration engineer to assist with our initial backend auth setup?", sentiment: 0.4 },
        { speaker: "Speaker A (Salesperson)", timestamp: "02:30", text: "We do, but only for our Premium Support tier which is an additional $500/month. Standard tier only has community forum forums and standard email tickets.", sentiment: 0.5 },
        { speaker: "Speaker B (Prospect)", timestamp: "02:44", text: "Hmm. I would need to check if we can absorb that setup fee. Is there any discount if we sign an annual service contract?", sentiment: 0.4 },
        { speaker: "Speaker A (Salesperson)", timestamp: "02:55", text: "No, unfortunately our API pricing is very standard and we don't offer discounts on the premium setup tier since engineers are in high demand.", sentiment: 0.2 },
        { speaker: "Speaker B (Prospect)", timestamp: "03:08", text: "Okay, let me print out your rate limit specs and discuss internally. Thanks for the details.", sentiment: 0.3 }
      ],
      sentimentTimeline: [
        { timestamp: "00:00", engagementSalesperson: 70, engagementProspect: 50, topic: "Intro & API Inquiry" },
        { timestamp: "00:30", engagementSalesperson: 85, engagementProspect: 60, topic: "Rate Limits Pitch" },
        { timestamp: "01:00", engagementSalesperson: 80, engagementProspect: 55, topic: "Technical Webhook QA" },
        { timestamp: "01:30", engagementSalesperson: 80, engagementProspect: 60, topic: "Uptime & Tablet Dashboard" },
        { timestamp: "02:00", engagementSalesperson: 70, engagementProspect: 40, topic: "Onboarding Timeline Stress" },
        { timestamp: "02:30", engagementSalesperson: 50, engagementProspect: 30, topic: "Support Setup Fees" },
        { timestamp: "03:00", engagementSalesperson: 40, engagementProspect: 30, topic: "Stalled Negotiation & Exit" }
      ],
      coaching: {
        strengths: [
          "Excellent product knowledge: Alex answered difficult developer questions regarding backoff retry counts and rate limits instantly.",
          "Clear description of technical boundaries: Spoke with precision about REST setups and webhook limits." ,
          "Polite and responsive: Maintained a highly courteous customer service tone throughout the technical inquiry."
        ],
        missedOpportunities: [
          "Overtalking technical features: Alex focused heavily on infrastructure buzzwords ('Kubernetes nodes') instead of answering 'What is the human benefit layout?'",
          "Lack of empathy for tight timeline: Didn't validate or reassure the prospect about their 4-week deadline pressure, passing the burden off to self-serve docs.",
          "Inflexible closing/pricing strategy: Rejected contract discussions on support setup fees outright, shutting down negotiations instead of offering a temporary trial or pilot support wave."
        ],
        overallScore: 68,
        summary: "Alex is highly technical and represents product specs perfectly. However, the conversation felt too transactional, lacking proactive discovery. By overplaying infrastructure details and demonstrating zero negotiation flexibility on setup support, Alex let a warm retail lead walk away to 'review internally'.",
        keyMetrics: {
          talkRatioSales: 71,
          objectionHandling: 50,
          needsDiscovery: 45,
          closingAttempt: 40
        }
      }
    }
  },
  "tricky-negotiation": {
    filename: "Renewal_Negotiation_Custom_Retail.mp3",
    title: "High-Value Enterprise Contract Renewal",
    duration: "4m 45s",
    analysis: {
      transcript: [
        { speaker: "Speaker A (Salesperson)", timestamp: "00:05", text: "Mark, great to chat again! I saw that your team processed over 1.2 million orders through our portal last month. How are the regional stores liking the updated checkout panels?", sentiment: 0.8 },
        { speaker: "Speaker B (Prospect)", timestamp: "00:22", text: "Hey Helen. Yes, checkout speed is up 14%. But honestly, we're comparing budgets for the renewal, and we received a competitor bid that's 25% lower than StockFlow's current rate.", sentiment: 0.3 },
        { speaker: "Speaker A (Salesperson)", timestamp: "00:40", text: "A 14% increase in speed is fantastic! I'm glad that worked. Regarding the competitor bid, I completely understand the mandate to verify costs. If you don't mind, who is the other provider, and have they committed to an equivalent enterprise SLA?", sentiment: 0.7 },
        { speaker: "Speaker B (Prospect)", timestamp: "01:05", text: "It's SyncUp Retail. They offered a standard contract with a 99.5% uptime SLA, which they claim is plenty for our volume.", sentiment: 0.4 },
        { speaker: "Speaker A (Salesperson)", timestamp: "01:18", text: "I see. SyncUp is indeed standard. However, a 99.5% uptime means they allow roughly 3.6 hours of downtime every single month. For a brand processing 1.2 million orders, even 1 hour of outage during Saturday peak hours can wipe out $45,000 in card revenue.", sentiment: 0.8 },
        { speaker: "Speaker B (Prospect)", timestamp: "01:45", text: "Oof. I hadn't calculated the absolute hourly cost. $45,000 per downtime hour is massive. But even so, a 25% price difference is about $18,000 of absolute spend difference annually.", sentiment: 0.4 },
        { speaker: "Speaker A (Salesperson)", timestamp: "02:06", text: "Exactly, it is $18,000. But if our 99.99% SLA prevents even just one peak-hour outage this year, it fully covers that SyncUp price difference twice over. Essentially, StockFlow is an insurance policy for your checkout desk.", sentiment: 0.85 },
        { speaker: "Speaker B (Prospect)", timestamp: "02:30", text: "Hmph. I can't argue with that transactional math. Uptime is critical for us. But is there anything you can do on our annual payment terms to make this renewal run smoother for our accounting schedule?", sentiment: 0.6 },
        { speaker: "Speaker A (Salesperson)", timestamp: "02:48", text: "I want to make sure your accounting team loves us. While we can't discount the absolute license price, I can split your annual invoice into four quarterly installments. That spreads out the cash flow while keeping your 99.99% premium SLA active.", sentiment: 0.9 },
        { speaker: "Speaker B (Prospect)", timestamp: "03:15", text: "Quarterly installments would be perfect! That will fly right through accounting without dragging out the approval chain.", sentiment: 0.85 },
        { speaker: "Speaker A (Salesperson)", timestamp: "03:28", text: "Fantastic! I will draft the quarterly billing amendment and attach it to the renewal contract. If I get that to you by noon, can we lock down the signature by Friday close so your team doesn't lose portal access?", sentiment: 0.85 },
        { speaker: "Speaker B (Prospect)", timestamp: "03:50", text: "Yes, definitely. Draft that up, and I'll route it directly to our CFO. Thanks for being of help, Helen.", sentiment: 0.9 },
        { speaker: "Speaker A (Salesperson)", timestamp: "04:05", text: "Always a pleasure partner, Mark! We are proud to keep power running for your stores. Talk soon!", sentiment: 0.9 }
      ],
      sentimentTimeline: [
        { timestamp: "00:00", engagementSalesperson: 80, engagementProspect: 60, topic: "Account Review & Success Checks" },
        { timestamp: "00:45", engagementSalesperson: 70, engagementProspect: 40, topic: "Competitor Competence Challenge" },
        { timestamp: "01:30", engagementSalesperson: 85, engagementProspect: 50, topic: "SLA & Downtime Financial Calculations" },
        { timestamp: "02:15", engagementSalesperson: 85, engagementProspect: 65, topic: "ROI Validation" },
        { timestamp: "03:00", engagementSalesperson: 90, engagementProspect: 80, topic: "Negotiating Cash Flow & Installments" },
        { timestamp: "03:45", engagementSalesperson: 90, engagementProspect: 90, topic: "Secure Verbal Lock" },
        { timestamp: "04:30", engagementSalesperson: 95, engagementProspect: 95, topic: "Action Terms Confirmation & Farewell" }
      ],
      coaching: {
        strengths: [
          "Exceptional objection handling: Instantly converted a competitor pricing objection into an uptime value debate, calculating physical revenue losses ($45,000/hr).",
          "Genius structural compromise: Offered split quarterly payment structures to ease the prospect's accounting concerns without devaluing the core product rate.",
          "Flawless closing urge: Tied the action step directly to concrete deadlines (Friday signature) to prevent renewal delays."
        ],
        missedOpportunities: [
          "Didn't look for land-and-expand: Helen could have checked if Mark opened new brick-and-mortar stores to expand contract scopes.",
          "Missed referral pitches: Missed the chance to ask Mark if he has friends in other retail systems who need uptime insurance.",
          "Brief review dashboard pitch: Could have briefly mentioned they can self-reconcile real-time SLA metrics inside their enterprise portal."
        ],
        overallScore: 94,
        summary: "Helen executed a masterpieces renewal defense. She demonstrated profound customer context and used clear mathematical metrics to justify premium software pricing, turning a likely loss to SyncUp into a rapid, secure subscription extension. Superb sales consulting.",
        keyMetrics: {
          talkRatioSales: 51,
          objectionHandling: 96,
          needsDiscovery: 88,
          closingAttempt: 92
        }
      }
    }
  }
};

// Real-Time Audio AI Analysis Endpoint using Gemini 3.5 Flash
app.post("/api/analyze-audio", async (req, res) => {
  const { audioBase64, mimeType, filename, recordingDuration } = req.body;

  if (!audioBase64) {
    return res.status(400).json({ error: "Missing audio data file." });
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;

  // Graceful offline fallback in case the API key is not yet configured or is a placeholder
  const isKeyMissingOrPlaceholder = !geminiApiKey || geminiApiKey === "" || geminiApiKey.includes("MY_GEMINI_API_KEY");

  if (isKeyMissingOrPlaceholder) {
    console.warn("GEMINI_API_KEY is not configured or is a placeholder. Returning simulated high-fidelity analysis.");
    // Simulate latency for realistic feedback
    await new Promise((resolve) => setTimeout(resolve, 3500));
    
    // Construct a beautiful simulated response tailored to live recording if present
    const promptRefStr = filename || "Microphone Session";
    const durationStr = recordingDuration ? `${Math.floor(recordingDuration / 60)}m ${Math.floor(recordingDuration % 60)}s` : "0m 45s";
    
    return res.json({
      success: true,
      simulated: true,
      analysis: {
        transcript: [
          { speaker: "Speaker A (Salesperson)", timestamp: "00:02", text: `Welcome to the consultation! My name is John. Thank you for uploading '${promptRefStr}'. How's your week going?`, sentiment: 0.8 },
          { speaker: "Speaker B (Prospect)", timestamp: "00:12", text: "Hey John! Doing well. We've been looking into sales coaching tools and want to automate our core feedback loop.", sentiment: 0.7 },
          { speaker: "Speaker A (Salesperson)", timestamp: "00:24", text: "Excellent! Automation saves so much time. Can you tell me what specific software integrations you use today?", sentiment: 0.75 },
          { speaker: "Speaker B (Prospect)", timestamp: "00:36", text: "We mostly use standard tools and spreadsheets, but everything is disconnected right now, which is a major pain point.", sentiment: -0.2 },
          { speaker: "Speaker A (Salesperson)", timestamp: "00:48", text: "That is very common! Let me walk you through how our platform links all data feeds in fifteen seconds.", sentiment: 0.9 },
          { speaker: "Speaker B (Prospect)", timestamp: "01:02", text: "Oh, that interface is incredibly clean. But what happens to historical records from last year?", sentiment: 0.4 },
          { speaker: "Speaker A (Salesperson)", timestamp: "01:14", text: "We offer full one-click historical imports! It reads your old sheets automatically and imports everything under ten minutes.", sentiment: 0.85 },
          { speaker: "Speaker B (Prospect)", timestamp: "01:28", text: "Wow, ten minutes is really fast. Let's start a trial to test this out with our team.", sentiment: 0.9 }
        ],
        sentimentTimeline: [
          { timestamp: "00:00", engagementSalesperson: 70, engagementProspect: 50, topic: "Greetings & Setup" },
          { timestamp: "00:20", engagementSalesperson: 80, engagementProspect: 65, topic: "Needs Discovery" },
          { timestamp: "00:40", engagementSalesperson: 85, engagementProspect: 55, topic: "Technical Demonstration" },
          { timestamp: "01:00", engagementSalesperson: 90, engagementProspect: 80, topic: "Feature Resolution" },
          { timestamp: "01:20", engagementSalesperson: 95, engagementProspect: 90, topic: "Closing Trial Agreement" }
        ],
        coaching: {
          strengths: [
            "Immediate Warm Welcome: John established rapport within the first two seconds, greeting the client by name and setting an engaging tone.",
            "Active Listening Check: Paraphrased the client's integration sync issues perfectly before launching into the demo solutions.",
            "Strong Value Presentation: Anchored the interface speed as the main time-saving asset to address the core problem."
          ],
          missedOpportunities: [
            "Did not verify absolute user counts: John missed asking how many agents would require platform training on the team.",
            "Could explore secondary tool requirements: Didn't check what CRM they use before focusing entirely on spreadsheets.",
            "No firm follow-up schedule: John promised a trial link but failed to establish a 10-minute touchpoint callback call."
          ],
          overallScore: 88,
          summary: `This is a high-quality conversation with excellent client engagement. The representative structured the value proposition brilliantly around automation and spreadsheet replacement. With some added inquiry parameters regarding sales volume, this representative could elevate closing speeds.`,
          keyMetrics: {
            talkRatioSales: 54,
            objectionHandling: 85,
            needsDiscovery: 80,
            closingAttempt: 90
          }
        }
      }
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    // We pass the Base64 audio directly to Gemini 3.5 Flash using inlineData
    const contents = [
      {
        inlineData: {
          mimeType: mimeType || "audio/mp3",
          data: audioBase64,
        },
      },
      {
        text: `You are an expert sales presentation coach and conversational analyst.
Analyze the attached sales call audio.
Please listen to the entire call and return a complete diarization, transcript, sentiment graph timeline, and detailed coaching card.

In your analysis:
1. Divide speakers clearly into:
   - "Speaker A (Salesperson)" and "Speaker B (Prospect)"
2. Provide a transcript segment by segment, with timestamps (MM:SS formatting relative to the audio length). For each segment, output the spoken text and a sentiment/engagement score from -1.0 to 1.0. If the content is too brief, write realistic timestamps and dialog.
3. Construct a progressive 'sentimentTimeline' showing engagement level scores (0 to 100) for both the salesperson and prospect at regular timestamp intervals (at least 5-10 points over the course of the call). Highlight the topic/agenda at that moment (e.g., "Introduction", "Needs Discovery", "Feature Demo", "Objection Handling", "Closing").
4. Provide a rich 'coaching' sheet containing:
   - Strengths: Exactly 3 distinct things the salesperson did exceptionally well. Include references or quoting scripts if possible.
   - Missed Opportunities: Exactly 3 clear missed opportunities or areas for improvement, accompanied by constructive, actionable coaching suggestions on how to do better next time.
   - Overall Score: An integer rating out of 100 for the salesperson's performance.
   - Summary: A concise executive summary of the performance showing praise and critical feedback.
   - KeyMetrics: Realistic scores for 'talkRatioSales' (0-100 percentage talking time), 'objectionHandling' (0-100), 'needsDiscovery' (0-100), and 'closingAttempt' (0-100).

Return strictly a JSON object adhering to the specified schema, without any markdown formatting or extra text.`,
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker: { type: Type.STRING, description: "Who is speaking, strictly categorized as 'Speaker A (Salesperson)' or 'Speaker B (Prospect)'" },
                  timestamp: { type: Type.STRING, description: "MM:SS timestamp matching the call timeline" },
                  text: { type: Type.STRING, description: "The transcribed text of the spoken segment" },
                  sentiment: { type: Type.NUMBER, description: "Sentiment score from -1.0 (very negative) to +1.0 (very positive)" }
                },
                required: ["speaker", "timestamp", "text", "sentiment"]
              }
            },
            sentimentTimeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.STRING },
                  engagementSalesperson: { type: Type.NUMBER, description: "Engagement score of salesperson, scale 0 to 100" },
                  engagementProspect: { type: Type.NUMBER, description: "Engagement score of prospect, scale 0 to 100" },
                  topic: { type: Type.STRING, description: "Current conversation stage or topic" }
                },
                required: ["timestamp", "engagementSalesperson", "engagementProspect", "topic"]
              }
            },
            coaching: {
              type: Type.OBJECT,
              properties: {
                strengths: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Exactly 3 distinct highlights/successes of the salesperson."
                },
                missedOpportunities: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Exactly 3 distinct missed opportunities/areas for improvement, with clear coaching suggestions."
                },
                overallScore: { type: Type.INTEGER, description: "Quality score for the salesperson out of 100" },
                summary: { type: Type.STRING, description: "Executive summary of the representative's performance" },
                keyMetrics: {
                  type: Type.OBJECT,
                  properties: {
                    talkRatioSales: { type: Type.INTEGER, description: "Approximate percentage of total talk time by salesperson, 0 to 100" },
                    objectionHandling: { type: Type.INTEGER, description: "Score 0 to 100" },
                    needsDiscovery: { type: Type.INTEGER, description: "Score 0 to 100" },
                    closingAttempt: { type: Type.INTEGER, description: "Score 0 to 100" }
                  },
                  required: ["talkRatioSales", "objectionHandling", "needsDiscovery", "closingAttempt"]
                }
              },
              required: ["strengths", "missedOpportunities", "overallScore", "summary", "keyMetrics"]
            }
          },
          required: ["transcript", "sentimentTimeline", "coaching"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json({
      success: true,
      analysis: parsedData
    });

  } catch (error: any) {
    console.error("Gemini call failed:", error);
    return res.status(500).json({
      error: "Failed to process audio analysis via Gemini model.",
      message: error.message
    });
  }
});

// Endpoint to load premium simulation calls
app.get("/api/samples/:id", (req, res) => {
  const sampleId = req.params.id as keyof typeof SAMPLES_DATA;
  const data = SAMPLES_DATA[sampleId];
  if (!data) {
    return res.status(404).json({ error: "Sample call option not found." });
  }
  return res.json({
    success: true,
    ...data
  });
});

async function startServer() {
  // Vite integration middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on host 0.0.0.0 port ${PORT}`);
  });
}

startServer();
