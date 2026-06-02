/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialize GoogleGenAI as suggested in instructions to avoid crashing if API key is missing.
// We then handle missing keys gracefully in endpoints.
let ai: GoogleGenAI | null = null;
function getGenAIClient(): GoogleGenAI | null {
  if (!ai && process.env.GEMINI_API_KEY) {
    try {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    } catch (e) {
      console.error("Failed to initialize GoogleGenAI client:", e);
    }
  }
  return ai;
}

// In-Memory Database store
interface TempAddress {
  id: string;
  address: string;
  expiresAt: string;
  createdAt: string;
  planType: 'free' | 'pro' | 'api';
}

interface MailMessage {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  receivedAt: string;
  unread: boolean;
  headers: string;
  attachments?: {
    name: string;
    size: string;
    type: string;
  }[];
}

interface TelemetryLog {
  id: string;
  timestamp: string;
  service: 'Frontend' | 'MailEngine' | 'ApiServer' | 'QueueWorker' | 'Database';
  level: 'info' | 'warn' | 'error';
  message: string;
}

const activeAddresses: TempAddress[] = [];
const inboxMessages: Record<string, MailMessage[]> = {}; // key: address_id (temp address ID)
const systemLogs: TelemetryLog[] = [
  {
    id: "init-1",
    timestamp: new Date().toISOString(),
    service: "MailEngine",
    level: "info",
    message: "SMTP server engine listening successfully on port 25 with Postfix wrapper"
  },
  {
    id: "init-2",
    timestamp: new Date().toISOString(),
    service: "Database",
    level: "info",
    message: "PostgreSQL database connected. Master cluster status: Healthy"
  },
  {
    id: "init-3",
    timestamp: new Date().toISOString(),
    service: "QueueWorker",
    level: "info",
    message: "BullMQ queue listener created. Domain Rotations worker subscribed"
  },
  {
    id: "init-4",
    timestamp: new Date().toISOString(),
    service: "ApiServer",
    level: "info",
    message: "Fastify-based Node.js secure API routing ready. Rate limiter enabled (60 req/min)"
  }
];

const domainsList = [
  { id: "dom-1", domainName: "smail.live", status: "active", type: "public" },
  { id: "dom-2", domainName: "tempbox.xyz", status: "active", type: "public" },
  { id: "dom-3", domainName: "boxmail.pro", status: "active", type: "premium" },
  { id: "dom-4", domainName: "vmail.co", status: "active", type: "premium" }
];

// Seed initial mock user table list
const mockUsers = [
  { id: "usr-901", email: "mkphp35@gmail.com", plan: "pro", created_at: "2026-05-15T12:00:00Z" },
  { id: "usr-203", email: "developer@smail.pro", plan: "api", created_at: "2026-05-20T08:30:00Z" },
  { id: "usr-302", email: "user_test_free@smail.live", plan: "free", created_at: "2026-06-01T21:45:00Z" }
];

// Helper to push server logs
function pushLog(service: TelemetryLog['service'], level: TelemetryLog['level'], message: string) {
  const newLog: TelemetryLog = {
    id: `log-${Math.random().toString(36).substring(2, 11)}`,
    timestamp: new Date().toISOString(),
    service,
    level,
    message
  };
  systemLogs.unshift(newLog);
  if (systemLogs.length > 100) systemLogs.pop();
}

// REST APIS FOR TELEMETRY
app.get("/api/telemetry/logs", (req, res) => {
  res.json(systemLogs);
});

app.get("/api/telemetry/stats", (req, res) => {
  const activeCount = activeAddresses.length;
  const messagesCount = Object.values(inboxMessages).reduce((acc, curr) => acc + curr.length, 0);
  res.json({
    activeAddressesCount: activeCount,
    messagesReceivedCount: messagesCount,
    spamFilteredCount: Math.floor(messagesCount * 0.14) + 36,
    activeDomainsCount: domainsList.filter(d => d.status === "active").length,
    dbConnections: 8,
    cpuUsage: "0.8%",
    memoryUsage: "244MB / 1024MB"
  });
});

// REST ENDPOINTS FOR SYSTEM REPLICATION
// 1. Create Address
app.post("/api/v1/mail/create", (req, res) => {
  const { customPrefix, domainName, planType } = req.body;
  const selectedDomain = domainName || "smail.live";
  const plan = planType || "free";
  
  const prefix = customPrefix ? customPrefix.trim().toLowerCase().replace(/[^a-z0-9]/g, "") : Math.random().toString(36).substring(2, 10);
  const emailAddress = `${prefix}@${selectedDomain}`;
  
  const newAddr: TempAddress = {
    id: `addr-${Math.random().toString(36).substring(2, 11)}`,
    address: emailAddress,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
    planType: plan
  };
  
  activeAddresses.push(newAddr);
  inboxMessages[newAddr.id] = [];
  
  pushLog("ApiServer", "info", `REST API: Created address ${emailAddress} (Plan: ${plan})`);
  pushLog("Database", "info", `INSERT INTO temp_addresses values: ${newAddr.id}, address: ${emailAddress}`);
  
  res.status(201).json(newAddr);
});

// 2. Fetch Inbox
app.get("/api/v1/mail/inbox/:id", (req, res) => {
  const addressId = req.params.id;
  const addressExists = activeAddresses.find(a => a.id === addressId);
  if (!addressExists) {
    return res.status(404).json({ error: "Address not found or expired" });
  }
  const messages = inboxMessages[addressId] || [];
  
  // Auto mark all returned as read (simulated delay or retrieval)
  messages.forEach(m => { m.unread = false; });
  
  res.json(messages);
});

// 3. Delete Address / Expire
app.delete("/api/v1/mail/:id", (req, res) => {
  const addressId = req.params.id;
  const index = activeAddresses.findIndex(a => a.id === addressId);
  if (index === -1) {
    return res.status(404).json({ error: "Address not found" });
  }
  
  const removed = activeAddresses.splice(index, 1)[0];
  delete inboxMessages[addressId];
  
  pushLog("ApiServer", "info", `REST API: Released & deleted address: ${removed.address}`);
  pushLog("Database", "info", `DELETE FROM temp_addresses WHERE id = '${addressId}'`);
  
  res.json({ success: true, message: "Temporary address removed" });
});

// 4. Extend Lifetime
app.post("/api/v1/mail/extend/:id", (req, res) => {
  const addressId = req.params.id;
  const addr = activeAddresses.find(a => a.id === addressId);
  if (!addr) {
    return res.status(404).json({ error: "Address not found" });
  }
  
  addr.expiresAt = new Date(new Date(addr.expiresAt).getTime() + 10 * 60 * 1000).toISOString(); // add 10 mins
  
  pushLog("ApiServer", "info", `REST API: Extended lifetime for ${addr.address}`);
  pushLog("Database", "info", `UPDATE temp_addresses SET expires_at = '${addr.expiresAt}' WHERE id = '${addressId}'`);
  
  res.json(addr);
});

// 5. Database Simulated SQL Engine (Interactively inspect our database tables)
app.post("/api/simulated-db/query", (req, res) => {
  const { sql } = req.body;
  const cleanSql = (sql || "").trim().toLowerCase();
  
  pushLog("Database", "info", `Simulated Console Query Executed: "${sql}"`);
  
  // We reconstruct a rich dataset directly matching current active memory state!
  const dbUsers = [...mockUsers];
  
  const dbDomains = domainsList.map((d, index) => ({
    id: d.id,
    domain_name: d.domainName,
    status: d.status,
    type: d.type
  }));
  
  const dbTempAddresses = activeAddresses.map(a => ({
    id: a.id,
    user_id: "usr-901", // linked to current active user mock
    domain_id: a.address.endsWith("smail.live") ? "dom-1" : a.address.endsWith("tempbox.xyz") ? "dom-2" : a.address.endsWith("boxmail.pro") ? "dom-3" : "dom-4",
    address: a.address,
    expires_at: a.expiresAt
  }));
  
  const dbMessages: Array<any> = [];
  Object.entries(inboxMessages).forEach(([addrId, msgs]) => {
    msgs.forEach(m => {
      dbMessages.push({
        id: m.id,
        address_id: addrId,
        sender: `${m.senderName} <${m.senderEmail}>`,
        subject: m.subject,
        received_at: m.receivedAt
      });
    });
  });
  
  // Dynamic SQL executor (basic mock patterns for SELECT)
  try {
    if (!cleanSql.startsWith("select")) {
      return res.json({
        error: "This debug SQL console supports read-only 'SELECT' statements for security reasons.",
        success: false
      });
    }
    
    let table = "";
    if (cleanSql.includes("from users")) table = "users";
    else if (cleanSql.includes("from domains")) table = "domains";
    else if (cleanSql.includes("from temp_addresses")) table = "temp_addresses";
    else if (cleanSql.includes("from messages")) table = "messages";
    
    if (!table) {
      return res.json({
        error: "Table not found. Available tables in system: users, domains, temp_addresses, messages",
        success: false
      });
    }
    
    let rows: any[] = [];
    if (table === "users") rows = dbUsers;
    else if (table === "domains") rows = dbDomains;
    else if (table === "temp_addresses") rows = dbTempAddresses;
    else if (table === "messages") rows = dbMessages;
    
    // basic filter
    if (cleanSql.includes("where")) {
      const parts = cleanSql.split("where");
      const condition = parts[1].trim();
      
      if (condition.includes("plan") && table === "users") {
        const val = condition.includes("pro") ? "pro" : condition.includes("api") ? "api" : "free";
        rows = rows.filter(r => r.plan === val);
      } else if (condition.includes("status") && table === "domains") {
        rows = rows.filter(r => r.status === "active");
      } else if (condition.includes("address") && table === "temp_addresses") {
        // extract string search
        const match = condition.match(/'([^']+)'/);
        if (match) {
          const search = match[1];
          rows = rows.filter(r => r.address.includes(search));
        }
      }
    }
    
    res.json({
      success: true,
      query: sql,
      rows,
      count: rows.length,
      columns: rows.length > 0 ? Object.keys(rows[0]) : ["id"]
    });
  } catch (err: any) {
    res.json({
      success: false,
      error: `SQL syntax parser compiled with error: ${err.message}`
    });
  }
});

// SIMULATED INBOUND GENERATOR VIA GEMINI OR PROCEDURAL PRESETS
app.post("/api/generate-mail", async (req, res) => {
  const { customTopic, selectedPreset, addressId, addressName } = req.body;
  const clientAI = getGenAIClient();
  
  const recipientEmail = addressName || "user@smail.live";
  
  // Custom presets with beautiful CSS html bodies
  const presets: Record<string, any> = {
    netflix: {
      senderName: "Netflix Security",
      senderEmail: "info@netflix.com",
      subject: "Your Netflix Temporary Verification Code",
      htmlBody: `
        <div style="font-family: Arial, sans-serif; background-color: #141414; color: #ffffff; padding: 40px; text-align: center; border-radius: 8px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #E50914; font-size: 32px; font-weight: bold; margin-bottom: 20px;">NETFLIX</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #f3f3f3;">Hello,</p>
          <p style="font-size: 16px; line-height: 1.6; color: #f3f3f3;">We received a request to access your Netflix account through this email address. Use this verification code to complete your signup or secure your login:</p>
          <div style="background-color: #222222; border: 1px solid #333333; display: inline-block; font-size: 36px; font-weight: bold; letter-spacing: 4px; color: #E50914; padding: 15px 30px; margin: 25px 0; border-radius: 4px;">
            ${Math.floor(100000 + Math.random() * 90000).toString()}
          </div>
          <p style="font-size: 14px; color: #8c8c8c; margin-top: 30px;">If you did not request this, please disregard this email. This link and code will expire in 15 minutes.</p>
          <hr style="border: 0; border-top: 1px solid #333333; margin: 30px 0;">
          <p style="font-size: 12px; color: #a3a3a3;">Netflix Inc. 100 Winchester Circle, Los Gatos, CA 95032, USA</p>
        </div>
      `,
      textBody: "Netflix Verification Code. If you did not request this, please ignore."
    },
    github: {
      senderName: "GitHub Integration",
      senderEmail: "noreply@github.com",
      subject: "[GitHub] Security Alert: New personal access token created",
      htmlBody: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #0d1117; color: #c9d1d9; padding: 30px; border-radius: 8px; border: 1px solid #30363d; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 25px;">
            <svg height="32" viewBox="0 0 16 16" width="32" style="fill: #f0f6fc;"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.35 2.69.91 0 .67.01 1.3.01 1.49 0 .21-.15.47-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path></svg>
          </div>
          <h2 style="color: #f0f6fc; font-size: 20px; font-weight: 600; text-align: center; margin-bottom: 20px;">Hey @mkphp35,</h2>
          <p style="font-size: 15px; line-height: 1.6;">A new personal access token (classic) was recently added to your developer workflow profile account.</p>
          <div style="background-color: #161b22; border: 1px solid #30363d; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #58a6ff;">Token Name:</strong> SmailPro-Inbox-Integration</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #58a6ff;">Scopes:</strong> repo, read:org, user</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #58a6ff;">IP Address:</strong> 82.164.12.89</p>
          </div>
          <p style="font-size: 14px; text-align: center; color: #8b949e; margin-top: 25px;">If you did not generate this token, please visit your account credentials in your GitHub settings and revoke it immediately to avoid unauthorized commits.</p>
          <hr style="border: 0; border-top: 1px solid #30363d; margin: 25px 0;">
          <p style="font-size: 11px; color: #8b949e; text-align: center;">GitHub, Inc. • 88 Colin P Kelly Jr St • San Francisco, CA 94107</p>
        </div>
      `,
      textBody: "GitHub Alerts: New access token created for your account integration."
    },
    stripe: {
      senderName: "Stripe Billing",
      senderEmail: "billing-support@stripe.com",
      subject: "Receipt for Your SmailPro Premium Subscription Invoice #2819",
      htmlBody: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f9fc; color: #32325d; padding: 40px; border-radius: 12px; max-width: 580px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="display: flex; align-items: center; margin-bottom: 30px;">
            <span style="font-size: 22px; font-weight: bold; color: #635bff; letter-spacing: 0.5px;">stripe</span>
          </div>
          <div style="background-color: #ffffff; border-radius: 8px; padding: 25px; border: 1px solid #e3e8ee;">
            <p style="font-size: 13px; text-transform: uppercase; tracking: 0.5px; color: #8898aa; font-weight: bold; margin: 0 0 10px 0;">Receipt</p>
            <h1 style="font-size: 32px; font-weight: 600; margin: 0; color: #0a2540;">$9.99</h1>
            <p style="font-size: 14px; color: #424770; margin: 6px 0 20px 0;">Paid on June 2, 2026</p>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #424770;">
              <tr style="border-bottom: 1px solid #e3e8ee;">
                <td style="padding: 10px 0; font-weight: 500;">SmailPro API Plan (Monthly)</td>
                <td style="padding: 10px 0; text-align: right;">$9.99</td>
              </tr>
              <tr>
                <td style="padding: 12px 0 5px 0; color: #0a2540; font-weight: bold;">Total Paid</td>
                <td style="padding: 12px 0 5px 0; text-align: right; color: #0a2540; font-weight: bold;">$9.99</td>
              </tr>
            </table>
          </div>
          <div style="text-align: center; margin-top: 25px;">
            <a href="#" style="background-color: #635bff; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold; font-size: 14px; display: inline-block;">Manage Billing Portal</a>
          </div>
          <p style="font-size: 12px; color: #8898aa; text-align: center; margin-top: 30px;">Questions? Email support@stripe.com or visit our developer documentation help center.</p>
        </div>
      `,
      textBody: "Stripe Invoice paid successfully. Amount $9.99 for SmailPro API Plan."
    }
  };

  pushLog("MailEngine", "info", `Simulated SMTP trigger inbound for recipient: ${recipientEmail}`);

  let resultMail: MailMessage;

  // Use Gemini to generate high-fidelity dynamic HTML emails if requested & API key is live
  if (customTopic && clientAI) {
    try {
      pushLog("ApiServer", "info", `Gemini model 'gemini-3.5-flash' spinning up to generate realistic sandbox email...`);
      
      const systemInstruction = `
        You are an advanced test mail server synthetic payload generator.
        Write a hyper-realistic commercial email based on the user's prompt (topic/brand).
        Generate authentic looking header tracking keys, high-fidelity responsive HTML (with elegant card styling, typography, beautiful button links, responsive borders, dark/light theme accents which look professional), and a clear subject line matching the theme.
        Input recipient name is: ${recipientEmail}.
        Format as JSON according to responseSchema rules.
      `;

      const response = await clientAI.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Create highly engaging activation, utility, security, or promotional email content for: "${customTopic}" sent to: "${recipientEmail}"`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING, description: "A highly realistic subject line matching the brand context." },
              senderName: { type: Type.STRING, description: "Name of the service sending the email." },
              senderEmail: { type: Type.STRING, description: "Sender domain matching the brand service." },
              htmlBody: { type: Type.STRING, description: "Beautifully styled, robust, email-compatible responsive HTML code with cards." },
              textBody: { type: Type.STRING, description: "Plain-text markdown representation of the email content." },
              headers: { type: Type.STRING, description: "A block of realistic standard SMTP transmission MIME headers (SPF, DKIM, DMARC, Return-Path, Content-Type)." }
            },
            required: ["subject", "senderName", "senderEmail", "htmlBody", "textBody", "headers"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      
      resultMail = {
        id: `msg-${Math.random().toString(36).substring(2, 11)}`,
        senderName: parsed.senderName || "AI Mock System",
        senderEmail: parsed.senderEmail || "synthetic@sender.ai",
        subject: parsed.subject || `Notification Core: ${customTopic}`,
        htmlBody: parsed.htmlBody || `<p>${customTopic}</p>`,
        textBody: parsed.textBody || customTopic,
        receivedAt: new Date().toISOString(),
        unread: true,
        headers: parsed.headers || `X-Sender-Verified: PASS\nSPF-Check: PASS\nDKIM: PASS`
      };
      
      pushLog("QueueWorker", "info", `Successfully processed incoming artificial MX route via Gemini for: "${resultMail.subject}"`);
    } catch (err: any) {
      console.error("Gemini mail generation failed, dropping back to procedural presets:", err);
      pushLog("ApiServer", "warn", `Gemini generation failure: ${err.message}. Invoking system-sandbox fallback generator.`);
      
      // Fallback fallback procedural generator based on search keywords
      const topicLower = customTopic.toLowerCase();
      let presetSelected = "netflix";
      if (topicLower.includes("git") || topicLower.includes("token") || topicLower.includes("dev")) {
        presetSelected = "github";
      } else if (topicLower.includes("stripe") || topicLower.includes("bill") || topicLower.includes("pay")) {
        presetSelected = "stripe";
      }
      
      const chosen = presets[presetSelected];
      resultMail = {
        id: `msg-${Math.random().toString(36).substring(2, 11)}`,
        senderName: chosen.senderName,
        senderEmail: chosen.senderEmail,
        subject: `${chosen.subject} (Simulated Topic: ${customTopic})`,
        htmlBody: chosen.htmlBody,
        textBody: chosen.textBody,
        receivedAt: new Date().toISOString(),
        unread: true,
        headers: `X-Original-To: ${recipientEmail}\nDelivered-To: ${recipientEmail}\nReceived: from mail.fallback.local (127.0.0.1) by dovecot-storage\nAuthentication-Results: fallback-auth; dkim=pass (1024-bit key); spf=pass`
      };
    }
  } else {
    // Standard quick presets integration
    const chosen = presets[selectedPreset] || presets.netflix;
    resultMail = {
      id: `msg-${Math.random().toString(36).substring(2, 11)}`,
      senderName: chosen.senderName,
      senderEmail: chosen.senderEmail,
      subject: chosen.subject,
      htmlBody: chosen.htmlBody,
      textBody: chosen.textBody,
      receivedAt: new Date().toISOString(),
      unread: true,
      headers: `X-Original-To: ${recipientEmail}\nDelivered-To: ${recipientEmail}\nReceived: from postfix-relay.srv.local (10.0.0.4) by smail-dovecot-backend; SPF=PASS; DKIM=PASS; DMARC=PASS\nFeedback-ID: automatic-simulation-trigger`
    };
    pushLog("QueueWorker", "info", `Preset mail routing complete for ${resultMail.subject}`);
  }

  // Persist inside in-memory store
  if (addressId) {
    if (!inboxMessages[addressId]) {
      inboxMessages[addressId] = [];
    }
    inboxMessages[addressId].unshift(resultMail);
    
    // Log to simulated database
    pushLog("Database", "info", `INSERT INTO messages values: ${resultMail.id}, subject: "${resultMail.subject}" for temp_address: ${addressId}`);
  }
  
  res.status(200).json(resultMail);
});

// VITE MIDDLEWARE SETUP FOR FULL-STACK DEPLOYMENT
async function startServer() {
  // Define API routes FIRST, which we did above.
  
  // Dev mode setup (Vite dev server middleware)
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Mounted Vite development middleware");
  } else {
    // Production serving static assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log(`Mounted Production static asset handler at: ${distPath}`);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SmailPro Temp Engine listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
