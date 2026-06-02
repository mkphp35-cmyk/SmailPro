/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Terminal, Play, Clipboard, Check, Code, Settings } from "lucide-react";

interface ApiPlaygroundProps {
  lang: 'en' | 'ar';
  activeAddressId: string;
}

export function ApiPlayground({ lang, activeAddressId }: ApiPlaygroundProps) {
  const [activeEndpoint, setActiveEndpoint] = useState<string>("create");
  const [responseOutput, setResponseOutput] = useState<any>({
    status: "idle",
    timestamp: new Date().toISOString(),
    tip: lang === 'en' ? "Execute the playground call to inspect real JSON responses from SmailPro API." : "اضغط على زر التنفيذ لفحص مخرجات JSON الحقيقية لاتصالات البريد المؤقت."
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [customPrefixInput, setCustomPrefixInput] = useState<string>("devtest");

  const endpoints = [
    {
      id: "create",
      method: "POST",
      url: "/api/v1/mail/create",
      title_en: "Create Temporary Email",
      title_ar: "توليد بريد مؤقت جديد",
      desc_en: "Provision a new random temporary inbox or specify a custom user prefix.",
      desc_ar: "إنشاء عنوان جديد يتبع نطاق عام أو نظام مخصص على خوادمنا."
    },
    {
      id: "inbox",
      method: "GET",
      url: `/api/v1/mail/inbox/`,
      title_en: "Fetch Address Inbox Message Pool",
      title_ar: "جلب الرسائل الواردة للصندوق",
      desc_en: "Retrieve list of incoming emails received at specified temporary address ID.",
      desc_ar: "استرجاع قائمة البريد الموجه للعنوان بالتفاصيل، الترويسات والصلاحية."
    },
    {
      id: "delete",
      method: "DELETE",
      url: `/api/v1/mail/`,
      title_en: "Deprovision Address Instantly",
      title_ar: "حذف وإتلاف عنوان البريد فورا",
      desc_en: "Instantly force removal of active address and erase matching messages from DB tables.",
      desc_ar: "إيقاف وحذف العنوان وتحرير الدومين لضمان الخصوصية التامة للبيانات."
    }
  ];

  const getCurlSnippet = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : "https://smail.pro";
    const currentEp = endpoints.find(e => e.id === activeEndpoint);
    if (!currentEp) return "";

    if (activeEndpoint === "create") {
      return `curl -X POST "${origin}/api/v1/mail/create" \\
  -H "Content-Type: application/json" \\
  -d '{
    "customPrefix": "${customPrefixInput}",
    "domainName": "smail.live",
    "planType": "free"
  }'`;
    } else if (activeEndpoint === "inbox") {
      const idToUse = activeAddressId || "addr-xxxxxxx";
      return `curl -X GET "${origin}/api/v1/mail/inbox/${idToUse}"`;
    } else {
      const idToUse = activeAddressId || "addr-xxxxxxx";
      return `curl -X DELETE "${origin}/api/v1/mail/${idToUse}"`;
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(getCurlSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const executeCall = async () => {
    setIsLoading(true);
    try {
      if (activeEndpoint === "create") {
        const response = await fetch("/api/v1/mail/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customPrefix: customPrefixInput,
            domainName: "smail.live",
            planType: "api"
          })
        });
        const data = await response.json();
        setResponseOutput({
          status_code: 201,
          status_text: "Created",
          headers: { "content-type": "application/json" },
          data
        });
      } else if (activeEndpoint === "inbox") {
        if (!activeAddressId) {
          setResponseOutput({
            status_code: 400,
            status_text: "Bad Request",
            message: lang === 'en' ? "Please generate a temporary email address on the main screen first to fetch its inbox." : "برجاء توليد بريد مؤقت أولاً من القائمة العلوية لتتمكن من فحص صندوق الوارد."
          });
          return;
        }
        const response = await fetch(`/api/v1/mail/inbox/${activeAddressId}`);
        const data = await response.json();
        setResponseOutput({
          status_code: 200,
          status_text: "OK",
          headers: { "content-type": "application/json" },
          data
        });
      } else {
        if (!activeAddressId) {
          setResponseOutput({
            status_code: 400,
            status_text: "Bad Request",
            message: lang === 'en' ? "No active address session found to delete." : "لا تمانع في تخطي؛ لا توجد جلسة بريد نشطة حالياً لحذفها برمجياً."
          });
          return;
        }
        const response = await fetch(`/api/v1/mail/${activeAddressId}`, {
          method: "DELETE"
        });
        const data = await response.json();
        setResponseOutput({
          status_code: 200,
          status_text: "OK",
          headers: { "content-type": "application/json" },
          data
        });
      }
    } catch (e: any) {
      setResponseOutput({
        status_code: 500,
        status_text: "Internal Server Error",
        error: e.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="api-playground" className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mt-8">
      {/* Header */}
      <div className="border-b border-slate-800 p-6 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Code className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              {lang === 'en' ? "SmailPro Developer REST API Terminal" : "نظام مطوري واجهة التطبيقات المخصصة - REST API"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'en'
                ? "Query server state directly. Connect your microservices using standard HTTPS authentication."
                : "برمج واكشف التدفق بالطلب التفاعلي المباشر. اربط خوادمك الخلفية بوحدات البريد المؤقت."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 p-6">
        {/* Selection side (5 columns) */}
        <div className="xl:col-span-5 space-y-3">
          <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
            {lang === 'en' ? "ENDPOINTS INDEX" : "مؤشر نهايات الاتصال البرمجية"}
          </div>

          <div className="space-y-2">
            {endpoints.map((ep) => {
              const isSelected = activeEndpoint === ep.id;
              const isPost = ep.method === "POST";
              const isDelete = ep.method === "DELETE";
              return (
                <button
                  id={`api-btn-${ep.id}`}
                  key={ep.id}
                  onClick={() => setActiveEndpoint(ep.id)}
                  className={`w-full flex flex-col p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? "bg-slate-800/80 border-indigo-500 text-slate-100 shadow-md"
                      : "bg-slate-950/40 border-slate-800 hover:bg-slate-800/30 text-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      isPost ? "bg-emerald-500/20 text-emerald-400" : isDelete ? "bg-rose-500/20 text-rose-400" : "bg-indigo-500/20 text-indigo-400"
                    }`}>
                      {ep.method}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      {ep.url}{ep.id !== "create" ? (activeAddressId || ":id") : ""}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200 mt-1">
                    {lang === 'en' ? ep.title_en : ep.title_ar}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {lang === 'en' ? ep.desc_en : ep.desc_ar}
                  </p>
                </button>
              );
            })}
          </div>

          {activeEndpoint === "create" && (
            <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl space-y-2.5 mt-4">
              <span className="text-[10px] font-mono text-indigo-400 font-bold flex items-center gap-1.5 uppercase">
                <Settings className="w-3.5 h-3.5" />
                {lang === 'en' ? "Request Parameter Payload" : "حمولة الطلب (Payload Parameters)"}
              </span>
              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-mono mb-1">customPrefix</label>
                <input
                  id="api-custom-prefix-input"
                  type="text"
                  value={customPrefixInput}
                  onChange={(e) => setCustomPrefixInput(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                  className="w-full text-xs font-mono bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Integration Console (7 columns) */}
        <div className="xl:col-span-7 flex flex-col justify-between space-y-4">
          {/* cURL Request Visualizer */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-900 bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono">{lang === 'en' ? "REQUEST PATTERN (cURL CLIENT)" : "صيغة الطلب المبرمج (cURL)"}</span>
              <button
                id="copy-api-snippet-btn"
                onClick={copyCode}
                className="flex items-center gap-1.5 text-slate-400 hover:text-slate-100 transition-colors font-mono hover:underline cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Clipboard className="w-3 h-3" />}
                {copied ? "Copied" : "Copy Code"}
              </button>
            </div>
            <pre id="curl-code-block" className="p-4 overflow-x-auto text-[11px] font-mono text-slate-300 leading-relaxed max-h-56">
              {getCurlSnippet()}
            </pre>
          </div>

          {/* Action trigger button */}
          <div className="flex justify-end">
            <button
              id="execute-api-playground-btn"
              onClick={executeCall}
              disabled={isLoading}
              className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-bold px-6 py-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/20 transition-all disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              {lang === 'en' ? "Execute Playground Sandbox Call" : "تشغيل تنفيذ المكالمة البرمجية"}
            </button>
          </div>

          {/* Response payload console */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex-1 flex flex-col justify-between">
            <div className="px-4 py-2 border-b border-slate-900 bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                {lang === 'en' ? "REST SERVER RESPONSE OUTLINE" : "استجابة الخادم المرتجعة"}
              </span>
              {responseOutput.status_code && (
                <span className={`font-mono font-bold text-xs ${responseOutput.status_code < 300 ? "text-emerald-400" : "text-rose-400"}`}>
                  HTTP {responseOutput.status_code} {responseOutput.status_text}
                </span>
              )}
            </div>

            <pre id="api-response-block" className="p-4 overflow-y-auto text-emerald-400 font-mono text-[11px] leading-relaxed max-h-64 flex-1">
              {JSON.stringify(responseOutput, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
