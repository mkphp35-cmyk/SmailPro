/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'en' | 'ar';

export interface MailMessage {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  receivedAt: string; // ISO String
  unread: boolean;
  headers: string;
  attachments?: {
    name: string;
    size: string;
    type: string;
  }[];
}

export interface TempAddress {
  id: string;
  address: string;
  expiresAt: string; // ISO String
  createdAt: string; // ISO String
  planType: 'free' | 'pro' | 'api';
}

export interface Domain {
  id: string;
  domainName: string;
  status: 'active' | 'rotated' | 'deprecated';
  type: 'public' | 'premium';
}

export interface TelemetryLog {
  id: string;
  timestamp: string;
  service: 'Frontend' | 'MailEngine' | 'ApiServer' | 'QueueWorker' | 'Database';
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface DbTableData {
  users: Array<{
    id: string;
    email: string;
    plan: string;
    created_at: string;
  }>;
  domains: Array<{
    id: string;
    domain_name: string;
    status: string;
    type: string;
  }>;
  temp_addresses: Array<{
    id: string;
    user_id: string;
    domain_id: string;
    address: string;
    expires_at: string;
  }>;
  messages: Array<{
    id: string;
    address_id: string;
    sender: string;
    subject: string;
    received_at: string;
  }>;
}

export interface TranslationSet {
  title: string;
  subtitle: string;
  createBtn: string;
  extendBtn: string;
  regenerateBtn: string;
  copySuccess: string;
  expiresIn: string;
  noEmails: string;
  sender: string;
  subject: string;
  received: string;
  inbox: string;
  refreshing: string;
  viewHeaders: string;
  backInbox: string;
  simWizardTitle: string;
  simWizardDesc: string;
  simTopicLabel: string;
  simBtn: string;
  architectTitle: string;
  architectDesc: string;
  apiTitle: string;
  apiDesc: string;
  apiTryBtn: string;
  logsTitle: string;
  logsDesc: string;
  adminTitle: string;
  adminDesc: string;
  upgradeBtn: string;
  premiumStatus: string;
  proFeatureTitle: string;
}
