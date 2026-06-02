/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Server, Layout, Database, Terminal, Shield, RefreshCw, Cpu, Activity } from "lucide-react";

interface SystemArchitectureProps {
  lang: 'en' | 'ar';
}

interface DBQueryResult {
  success: boolean;
  rows?: any[];
  count?: number;
  columns?: string[];
  error?: string;
}

export function SystemArchitecture({ lang }: SystemArchitectureProps) {
  const [activeSystem, setActiveSystem] = useState<string>("mail_engine");
  const [sqlQuery, setSqlQuery] = useState<string>("SELECT * FROM temp_addresses ORDER BY expires_at DESC;");
  const [queryResult, setQueryResult] = useState<DBQueryResult | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const systems = [
    {
      id: "frontend",
      icon: Layout,
      title: lang === 'en' ? "1. Website Frontend" : "1. واجهة المستخدم الرسومية",
      tech: "React / Vite, Tailwind CSS, Lucide Icons",
      desc_en: "A responsive client-side app featuring countdown timers, quick copywriting, dual-language triggers, full-fidelity HTML email parsing, and and an API sandbox console.",
      desc_ar: "واجهة الاستخدام التفاعلية، تدعم العدادات التنازلية، النسخ السريع بلمسة، تبديل فوري للغات، قارئ HTML آمن متطور مدمج لتصفح الرسائل وحركية Telemetry."
    },
    {
      id: "mail_engine",
      icon: Shield,
      title: lang === 'en' ? "2. Mail Routing Engine" : "2. محرك البريد الإلكتروني",
      tech: "Postfix, Dovecot, Rspamd, SPF, DKIM, DMARC",
      desc_en: "Handles MX routing, verifies SPF passing and DKIM certificate signers, filters inbound spam, and stores raw MIME streams directly into secure mailbox databases.",
      desc_ar: "يتولى توجيه سجلات MX، وفحص SPF/DKIM للتأكد من سلامة المرسلين، وفلترة الرسائل المزعجة باستخدام Rspamd وحفظ مسارات MIME خاما للبروتوكول."
    },
    {
      id: "api_server",
      icon: Server,
      title: lang === 'en' ? "3. Secure API Server" : "3. خادم المخدم الرئيسي (API)",
      tech: "Node.js Custom Express (NestJS replica), JWT Security",
      desc_en: "Routes client actions, handles temporary address provisioning, updates lifetimes, and serves the developer endpoints.",
      desc_ar: "يتولى تمرير الطلبات، التحكم بصلاحية العناوين المؤقتة وحمايتها، توليد ترويسات API وتوافق نهايات الاتصال."
    },
    {
      id: "workers",
      icon: RefreshCw,
      title: lang === 'en' ? "4. Background Workers" : "4. العمال في الخلفية (Workers)",
      tech: "BullMQ, Redis Engine, Node-Scheduler",
      desc_en: "Asynchronous task workers responsible for expiring temporary email addresses, purging archived email messages, rotating server IP domains, and maintaining cache storage.",
      desc_ar: "برمجيات عمل في الخلفية لمسح العناوين منتهية الصلاحية وحذف الرسائل المقترنة بها تلقائيا، تحويل النطاقات وتصفير الموارد المتراكمة بالذاكرة المؤقتة."
    },
    {
      id: "admin",
      icon: Terminal,
      title: lang === 'en' ? "5. Admin Telemetry Panel" : "5. لوحة المراقبة والتحكم للمشرف",
      tech: "Grafana monitoring, Prometheus metrics",
      desc_en: "Displays active bandwidth telemetry, spam block metrics, database query analytics, and lets operators insert new MX configurations into the domain pool.",
      desc_ar: "تعرض نشاط الشبكة وبث حزم البيانات، أحجام الرسائل القادمة، إدارة النطاقات النشطة وإدراج نطاق جديد لمجموعة الدومينات."
    }
  ];

  const dbPresets = [
    { label: "Select * Temp Addresses", query: "SELECT * FROM temp_addresses ORDER BY expires_at DESC;" },
    { label: "Select * Incoming Emails", query: "SELECT * FROM messages ORDER BY received_at DESC;" },
    { label: "Select * Registered Domains", query: "SELECT * FROM domains WHERE status = 'active';" },
    { label: "Select * Subscriber Accounts", query: "SELECT * FROM users WHERE plan = 'pro';" }
  ];

  const executeSql = async (inputQuery: string) => {
    setIsRunning(true);
    try {
      const res = await fetch("/api/simulated-db/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql: inputQuery })
      });
      const data = await res.json();
      setQueryResult(data);
    } catch (e: any) {
      setQueryResult({ success: false, error: e.message });
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    executeSql(sqlQuery);
  }, []);

  return (
    <div id="architecture-tour" className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mt-8">
      {/* Header */}
      <div className="border-b border-slate-800 p-6 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-sans tracking-tight">
              {lang === 'en' ? "Engineering Architecture & DB Engine Explorer" : "لوحة المراقبة التفاعلية ومخطط قاعدة البيانات"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'en' 
                ? "Click the system blocks to dissect operations, or run direct SQL queries on Sandbox DB below." 
                : "اضغط على مكونات النظام لاستكشاف التفاصيل التقنية، أو نفذ استعلامات SQL حية في قاعدة البيانات بالأسفل."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-semibold">
            {lang === 'en' ? "Cluster Status: Sync" : "حالة العنقود: متصل"}
          </span>
        </div>
      </div>

      {/* Grid Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        {/* Schematic Block Selector (12 columns split: 7 items and 5 specs) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2 font-semibold">
            {lang === 'en' ? "SYSTEM TOPOLOGY" : "الهيكل الهيكلي للمكونات"}
          </div>
          
          <div className="grid grid-cols-1 gap-2.5">
            {systems.map((sys) => {
              const IconComp = sys.icon;
              const isActive = activeSystem === sys.id;
              return (
                <button
                  id={`sys-btn-${sys.id}`}
                  key={sys.id}
                  onClick={() => setActiveSystem(sys.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                    isActive 
                      ? "bg-slate-800/80 border-indigo-500/80 shadow-md text-slate-100" 
                      : "bg-slate-950/40 border-slate-800 hover:bg-slate-800/30 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  <div className={`p-2.5 rounded-lg transition-colors ${
                    isActive ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-900 text-slate-500"
                  }`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-semibold transition-colors ${isActive ? "text-slate-100" : "text-slate-300"}`}>
                        {sys.title}
                      </h4>
                      <span className="text-[10px] font-mono bg-slate-900/60 px-2 py-0.5 rounded text-slate-500">
                        {sys.tech.split(',')[0]}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Spec Panel */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-950/60 border border-slate-800 p-5 rounded-xl">
          <div>
            <div className="flex items-center justify-between border-b border-indigo-500/10 pb-3 mb-4">
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
                {lang === 'en' ? "ACTIVE BLUEPRINT SPEC" : "مواصفات النظام المحدد"}
              </span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>

            {(() => {
              const selectedSys = systems.find(s => s.id === activeSystem);
              if (!selectedSys) return null;
              const SysIcon = selectedSys.icon;
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                      <SysIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-200">{selectedSys.title}</h3>
                      <p className="text-xs text-indigo-300 font-mono mt-0.5">{selectedSys.tech}</p>
                    </div>
                  </div>

                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line mt-3">
                    {lang === 'en' ? selectedSys.desc_en : selectedSys.desc_ar}
                  </p>

                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/60 space-y-2 mt-4">
                    <div className="text-[10px] font-mono text-indigo-400 font-semibold uppercase">
                      {lang === 'en' ? "Sandbox Simulated Telemetry" : "إحصائيات المراقبة للمحاكاة"}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-slate-500">Response:</span>{" "}
                        <span className="text-slate-300">{(activeSystem === 'mail_engine' || activeSystem === 'workers') ? "8ms" : "2.4ms"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Failures:</span>{" "}
                        <span className="text-slate-300 text-emerald-400">0.00%</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Concurrency:</span>{" "}
                        <span className="text-slate-300">10k/sec</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Host:</span>{" "}
                        <span className="text-slate-300 font-bold">K8s Dev Cluster</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-900 text-[10px] text-slate-500 italic font-mono">
            {lang === 'en' 
              ? "* Simulated values trace accurate production benchmarks on Hetzner Bare Metal configurations." 
              : "* تعكس قيم القياس محاكاة حقيقية لمواصفات الإنتاج الفعلي على خواديم Hetzner المخصصة."}
          </div>
        </div>
      </div>

      {/* SQL Live Inspector Block */}
      <div className="border-t border-slate-800 p-6 bg-slate-950/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 font-mono">
              <Database className="w-4 h-4 text-indigo-400" />
              {lang === 'en' ? "PRO SQL SANDBOX CONSOLE (READ-ONLY)" : "وحدة استعلامات قاعدة البيانات التفاعلية (SQL)"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'en' 
                ? "Query live relational tables mirroring current in-memory address setups dynamically." 
                : "تصفح الجداول الارتباطية الحقيقية التي تعكس العناوين النشطة والرسائل الحالية."}
            </p>
          </div>
          
          {/* Query Presets */}
          <div className="flex flex-wrap gap-1.5 justify-end">
            {dbPresets.map((p, idx) => (
              <button
                id={`sql-preset-${idx}`}
                key={idx}
                onClick={() => {
                  setSqlQuery(p.query);
                  executeSql(p.query);
                }}
                className="text-[10px] font-mono bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium px-2.5 py-1 rounded transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Console Box */}
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row gap-2.5">
            <input
              id="sql-console-input"
              type="text"
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              placeholder="SELECT * FROM temp_addresses;"
              className="flex-1 font-mono text-xs bg-slate-950 text-emerald-400 border border-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500"
            />
            <button
              id="execute-query-btn"
              onClick={() => executeSql(sqlQuery)}
              disabled={isRunning}
              className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-semibold px-5 py-3 rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRunning ? "animate-spin" : ""}`} />
              {lang === 'en' ? "Execute Output" : "تنفيذ الاستعلام"}
            </button>
          </div>

          {/* Table display */}
          <div className="bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden font-mono text-[11px]">
            <div className="px-4 py-2 border-b border-slate-900 bg-slate-900/40 text-slate-500 flex items-center justify-between">
              <span>{lang === 'en' ? "QUERY RESULT MATRIX" : "مصفوفة نتائج الاستعلام"}</span>
              {queryResult?.count !== undefined && (
                <span className="text-emerald-500 font-bold">{queryResult.count} row(s) returned</span>
              )}
            </div>

            <div className="overflow-x-auto max-h-60 p-4">
              {queryResult ? (
                queryResult.success ? (
                  queryResult.rows && queryResult.rows.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800">
                          {queryResult.columns?.map((col, idx) => (
                            <th key={idx} className="p-2 text-indigo-300 uppercase tracking-wider font-semibold">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResult.rows.map((row, rowIdx) => (
                          <tr key={rowIdx} className="border-b border-slate-900 hover:bg-slate-900/30">
                            {queryResult.columns?.map((col, colIdx) => (
                              <td key={colIdx} className="p-2 text-slate-300 max-w-xs truncate">
                                {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-6 text-slate-500 italic">
                      {lang === 'en' ? "Query compiled successfully. Rows empty." : "تم الاستعلام بنجاح. لا توجد صفوف مطابقة."}
                    </div>
                  )
                ) : (
                  <div className="text-rose-400 p-2 border border-rose-500/20 bg-rose-500/5 rounded-lg">
                    {lang === 'en' ? "Database Core Error:" : "خطأ استعلام قاعدة البيانات:"} {queryResult.error}
                  </div>
                )
              ) : (
                <div className="text-center py-6 text-slate-500 italic">
                  {lang === 'en' ? "Run query to generate results..." : "اضغط تنفيذ الاستعلام لرؤية النتائج..."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
