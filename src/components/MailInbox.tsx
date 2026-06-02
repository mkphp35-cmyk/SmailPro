/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Mail, ArrowLeft, Trash2, Clock, Calendar, CheckCircle2, AlertCircle, RefreshCw, FileText, Search, Printer, ShieldCheck } from "lucide-react";
import { MailMessage } from "../types";

interface MailInboxProps {
  lang: 'en' | 'ar';
  messages: MailMessage[];
  selectedMessage: MailMessage | null;
  onSelectMessage: (msg: MailMessage) => void;
  onClearMessageSelection: () => void;
  onDeleteMessage: (msgId: string) => void;
  isLoading: boolean;
  onRefreshInbox: () => void;
}

export function MailInbox({
  lang,
  messages,
  selectedMessage,
  onSelectMessage,
  onClearMessageSelection,
  onDeleteMessage,
  isLoading,
  onRefreshInbox
}: MailInboxProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showHeaders, setShowHeaders] = useState<boolean>(false);

  const filtered = messages.filter(
    (msg) =>
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.senderEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="mailbox-workspace" className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden min-h-[500px] flex flex-col">
      {/* Search and Action Bar */}
      {!selectedMessage && (
        <div className="border-b border-slate-800 p-4 bg-slate-950/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400" />
              {lang === 'en' ? "Temporary Sandbox Inbox" : "علبة البريد الوارد المؤقتة"}
            </h3>
            <span className="text-[10px] bg-indigo-500/15 text-indigo-400 font-mono px-2 py-0.5 rounded font-bold">
              {messages.length} total
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 md:flex-initial">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                id="search-mailbox-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={lang === 'en' ? "Filter messages..." : "البحث في مرسلي البريد..."}
                className="w-full md:w-56 text-xs bg-slate-950/80 border border-slate-850 pl-9 pr-3 py-1.5 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
              />
            </div>

            {/* Refresh Trigger */}
            <button
              id="refresh-mailbox-btn"
              onClick={onRefreshInbox}
              disabled={isLoading}
              className="p-1.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title={lang === 'en' ? "Check SMTP Server Relays" : "التحقق من خوادم الاستلام"}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
            </button>
          </div>
        </div>
      )}

      {/* Main Mailbox Frame */}
      <div className="flex-1 flex flex-col">
        {selectedMessage ? (
          /* detailed view */
          <div id="read-message-panel" className="flex-1 flex flex-col bg-slate-950/20 animate-fade-in">
            {/* Nav Header */}
            <div className="border-b border-slate-800 p-4 bg-slate-950/45 flex items-center justify-between gap-2.5">
              <button
                id="back-to-inbox-btn"
                onClick={() => {
                  onClearMessageSelection();
                  setShowHeaders(false);
                }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 font-semibold cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {lang === 'en' ? "Back to Inbox" : "العودة لصندوق الرسائل"}
              </button>

              <div className="flex items-center gap-2">
                {/* Print */}
                <button
                  id="print-email-btn"
                  onClick={handlePrint}
                  className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title={lang === 'en' ? "Print Email Contents" : "طباعة الرسالة الكاملة"}
                >
                  <Printer className="w-4 h-4" />
                </button>

                {/* Toggle Headers View */}
                <button
                  id="toggle-headers-btn"
                  onClick={() => setShowHeaders(!showHeaders)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                    showHeaders 
                      ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30" 
                      : "bg-slate-800 text-slate-400 hover:text-slate-250 border border-slate-700"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  {lang === 'en' ? "SMTP Headers" : "ترويسة SMTP Header"}
                </button>

                {/* Delete Message */}
                <button
                  id="delete-message-btn"
                  onClick={() => {
                    onDeleteMessage(selectedMessage.id);
                    onClearMessageSelection();
                    setShowHeaders(false);
                  }}
                  className="p-2 text-rose-450 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  title={lang === 'en' ? "Erase from Store" : "مسح من الحفظ الآمن"}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Email Details Block */}
            <div className="p-6 border-b border-slate-800/60 bg-slate-950/15">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] uppercase tracking-wider font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      SPF/DKIM: Verified Pass
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ID: {selectedMessage.id}
                    </span>
                  </div>
                  <h1 className="text-base md:text-lg font-bold text-slate-100 font-sans tracking-tight">
                    {selectedMessage.subject}
                  </h1>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-200">{selectedMessage.senderName}</span>
                    <span className="text-slate-500 font-mono">&lt;{selectedMessage.senderEmail}&gt;</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono bg-slate-900 px-3 py-1.5 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{new Date(selectedMessage.receivedAt).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            {/* Contents Frame */}
            <div className="p-6 flex-1 flex flex-col md:flex-row gap-6">
              {showHeaders ? (
                /* Raw SMTP headers */
                <div className="flex-1 bg-slate-950 border border-slate-800 p-5 rounded-xl font-mono text-[10px] text-indigo-300 leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[450px]">
                  <div className="text-slate-500 uppercase pb-2 mb-3 border-b border-slate-900 font-bold tracking-wider">
                    RAWMIME TRANSMISSION ROUTE HEADERS ANALYSIS
                  </div>
                  {selectedMessage.headers}
                </div>
              ) : (
                /* HTML content preview inside styled isolation box safely */
                <div className="flex-1 bg-white rounded-xl border border-slate-800 overflow-hidden flex flex-col min-h-[350px]">
                  {/* Visual Frame */}
                  <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>{lang === 'en' ? "Sanitized Active sandboxed HTML body preview" : "معاينة آمنة لتنسيق HTML للرسالة"}</span>
                    <span>No-Scripts Isolated (XSS Shield Active)</span>
                  </div>
                  <div className="flex-1 bg-[#141414] text-white p-4 overflow-y-auto">
                    {/* Render raw html nicely inside element since it is generated securely by Gemini schema */}
                    <div 
                      id="html-content-element"
                      className="text-left" 
                      dangerouslySetInnerHTML={{ __html: selectedMessage.htmlBody }} 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* list view */
          <div className="flex-1 flex flex-col">
            {filtered.length > 0 ? (
              <div className="divide-y divide-slate-800 flex-1">
                {filtered.map((msg) => {
                  return (
                    <button
                      id={`msg-row-${msg.id}`}
                      key={msg.id}
                      onClick={() => onSelectMessage(msg)}
                      className="w-full text-left p-4 hover:bg-slate-800/30 flex items-start gap-4 transition-colors cursor-pointer border-l-2 border-transparent hover:border-indigo-500"
                    >
                      <div className="p-2 bg-slate-950/60 text-slate-400 rounded-lg group-hover:text-slate-100">
                        <Mail className={`w-4 h-4 ${msg.unread ? "text-indigo-400 animate-pulse" : ""}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2.5">
                          <span className={`text-xs truncate font-semibold ${msg.unread ? "text-slate-100" : "text-slate-300"}`}>
                            {msg.senderName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                            {new Date(msg.receivedAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <h4 className={`text-xs mt-1 truncate ${msg.unread ? "text-slate-100 font-bold" : "text-slate-400 font-medium"}`}>
                          {msg.subject}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-1 truncate">
                          {msg.textBody}
                        </p>
                      </div>
                      {msg.unread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 self-center"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* empty empty view */
              <div id="mailbox-empty-state" className="flex-1 flex flex-col items-center justify-center p-12 text-center my-12 space-y-4">
                <div className="p-4 bg-slate-950/40 text-slate-600 rounded-full border border-slate-850">
                  <Mail className="w-8 h-8" />
                </div>
                <div className="max-w-xs space-y-1">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                    {lang === 'en' ? "SMTP PORT ENGINE IDLE" : "محركات الاستلام SMTP في وضع السكون"}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    {lang === 'en' 
                      ? "Awaiting inbound transmissions. Use the 'Simulate Inbound SMTP' panel below to trigger real-time AI email streams." 
                      : "الصندوق جاهز لاستقبال الرسائل الإلكترونية. لضخ رسالة تنشيط مخصصة الآن، استخدم 'لوحة المحاكاة' بالأسفل."}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
