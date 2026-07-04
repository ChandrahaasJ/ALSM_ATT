import { Agent, Workflow, Log, Notification, User, Integration } from './types';

export const agents: Agent[] = [
  { id: 'ag-001', name: 'ContentBot Pro', model: 'GPT-4o', status: 'active', tasks: 1243, successRate: 98.2, lastRun: '2 min ago', tags: ['content', 'nlp'], description: 'Generates marketing copy and blog content at scale.', tokens: 2840000, latency: 320 },
  { id: 'ag-002', name: 'DataExtractor', model: 'Claude 3.5', status: 'active', tasks: 892, successRate: 96.7, lastRun: '5 min ago', tags: ['extraction', 'data'], description: 'Extracts structured data from unstructured documents.', tokens: 1920000, latency: 450 },
  { id: 'ag-003', name: 'SupportAgent', model: 'GPT-4o-mini', status: 'idle', tasks: 3401, successRate: 94.1, lastRun: '1 hr ago', tags: ['support', 'chat'], description: 'Handles tier-1 customer support inquiries.', tokens: 5100000, latency: 210 },
  { id: 'ag-004', name: 'CodeReviewer', model: 'Claude 3.5', status: 'active', tasks: 567, successRate: 99.1, lastRun: '12 min ago', tags: ['code', 'review'], description: 'Reviews pull requests and suggests improvements.', tokens: 980000, latency: 680 },
  { id: 'ag-005', name: 'ResearchBot', model: 'GPT-4o', status: 'error', tasks: 234, successRate: 87.4, lastRun: '3 hr ago', tags: ['research', 'web'], description: 'Conducts deep web research and summarizes findings.', tokens: 420000, latency: 1200 },
  { id: 'ag-006', name: 'EmailDrafter', model: 'GPT-4o-mini', status: 'paused', tasks: 1890, successRate: 95.8, lastRun: '2 days ago', tags: ['email', 'comms'], description: 'Drafts and personalizes outbound email campaigns.', tokens: 3200000, latency: 290 },
  { id: 'ag-007', name: 'TranslatorAI', model: 'Claude 3', status: 'active', tasks: 4532, successRate: 97.3, lastRun: 'Just now', tags: ['translation', 'nlp'], description: 'Translates content across 50+ languages with cultural context.', tokens: 7800000, latency: 380 },
  { id: 'ag-008', name: 'SEOOptimizer', model: 'GPT-4o', status: 'idle', tasks: 321, successRate: 91.2, lastRun: '6 hr ago', tags: ['seo', 'content'], description: 'Optimizes content for search engine visibility.', tokens: 640000, latency: 520 },
];

export const workflows: Workflow[] = [
  { id: 'wf-001', name: 'Lead Enrichment Pipeline', status: 'running', steps: 8, lastRun: '5 min ago', nextRun: 'Continuous', runs: 8921, owner: 'Sarah Chen', description: 'Enriches CRM leads with company data and social profiles.', duration: '2.3s avg' },
  { id: 'wf-002', name: 'Daily Report Generator', status: 'scheduled', steps: 5, lastRun: '8 hr ago', nextRun: 'Tomorrow 9am', runs: 342, owner: 'Mike Torres', description: 'Generates and distributes daily performance reports.', duration: '45s avg' },
  { id: 'wf-003', name: 'Content Moderation', status: 'running', steps: 4, lastRun: '1 min ago', nextRun: 'Continuous', runs: 124532, owner: 'System', description: 'Real-time moderation of user-generated content.', duration: '0.8s avg' },
  { id: 'wf-004', name: 'Invoice Processing', status: 'paused', steps: 6, lastRun: '2 days ago', nextRun: 'Paused', runs: 1203, owner: 'Finance Team', description: 'Extracts and validates invoice data automatically.', duration: '12s avg' },
  { id: 'wf-005', name: 'Customer Onboarding', status: 'running', steps: 12, lastRun: '3 min ago', nextRun: 'Continuous', runs: 4521, owner: 'Product Team', description: 'Automates the new customer onboarding journey.', duration: '5.2m avg' },
  { id: 'wf-006', name: 'Social Media Scheduler', status: 'failed', steps: 3, lastRun: '1 hr ago', nextRun: 'Retry in 15m', runs: 2341, owner: 'Marketing', description: 'Schedules and posts content across social platforms.', duration: '3s avg' },
  { id: 'wf-007', name: 'Compliance Checker', status: 'completed', steps: 7, lastRun: '30 min ago', nextRun: 'Weekly Mon', runs: 156, owner: 'Legal Team', description: 'Audits documents for regulatory compliance.', duration: '2.1m avg' },
];

export const logs: Log[] = [
  { id: 'log-001', timestamp: '2026-07-04 14:23:41', level: 'info', service: 'ContentBot Pro', message: 'Task completed successfully: Generated 1500-word blog post', traceId: 'abc-123', duration: 3240 },
  { id: 'log-002', timestamp: '2026-07-04 14:23:38', level: 'error', service: 'ResearchBot', message: 'Connection timeout to external search API after 30s', traceId: 'def-456', duration: 30000 },
  { id: 'log-003', timestamp: '2026-07-04 14:23:35', level: 'warn', service: 'DataExtractor', message: 'Rate limit approaching: 85% of quota used', traceId: 'ghi-789' },
  { id: 'log-004', timestamp: '2026-07-04 14:23:30', level: 'info', service: 'WorkflowEngine', message: 'Workflow "Lead Enrichment Pipeline" step 4/8 completed', traceId: 'jkl-012', duration: 1200 },
  { id: 'log-005', timestamp: '2026-07-04 14:23:28', level: 'debug', service: 'MemoryStore', message: 'Cache hit ratio: 94.2% — retrieved 142 vectors', traceId: 'mno-345' },
  { id: 'log-006', timestamp: '2026-07-04 14:23:22', level: 'info', service: 'TranslatorAI', message: 'Translated 3,400 characters EN → ES in 380ms', traceId: 'pqr-678', duration: 380 },
  { id: 'log-007', timestamp: '2026-07-04 14:23:18', level: 'error', service: 'SocialMedia Scheduler', message: 'OAuth token expired for Twitter integration', traceId: 'stu-901' },
  { id: 'log-008', timestamp: '2026-07-04 14:23:12', level: 'warn', service: 'BillingService', message: 'Usage at 78% of monthly plan limit', traceId: 'vwx-234' },
  { id: 'log-009', timestamp: '2026-07-04 14:23:08', level: 'info', service: 'Auth', message: 'User sarah@acme.com authenticated via SSO', traceId: 'yza-567' },
  { id: 'log-010', timestamp: '2026-07-04 14:23:01', level: 'info', service: 'CodeReviewer', message: 'PR #1024 reviewed: 3 suggestions, 0 critical issues', traceId: 'bcd-890', duration: 4800 },
  { id: 'log-011', timestamp: '2026-07-04 14:22:55', level: 'debug', service: 'KnowledgeBase', message: 'Indexed 24 new documents — embedding generation complete', traceId: 'efg-123' },
  { id: 'log-012', timestamp: '2026-07-04 14:22:48', level: 'info', service: 'SupportAgent', message: 'Resolved ticket #8821: Customer refund processed', traceId: 'hij-456', duration: 2100 },
];

export const notifications: Notification[] = [
  { id: 'n-001', title: 'Agent Error Detected', message: 'ResearchBot has exceeded error threshold (>10% failure rate) in the last hour.', type: 'error', read: false, timestamp: '5 min ago' },
  { id: 'n-002', title: 'Workflow Completed', message: 'Weekly Compliance Checker workflow finished successfully. 156 documents processed.', type: 'success', read: false, timestamp: '32 min ago' },
  { id: 'n-003', title: 'Usage Warning', message: 'Your organization has used 78% of the monthly token budget. Consider upgrading.', type: 'warning', read: false, timestamp: '1 hr ago' },
  { id: 'n-004', title: 'New Team Member', message: 'Alex Johnson has joined your organization as a Developer.', type: 'info', read: true, timestamp: '3 hr ago' },
  { id: 'n-005', title: 'Integration Disconnected', message: 'Twitter/X OAuth token expired. Social Media Scheduler workflow is paused.', type: 'error', read: false, timestamp: '1 hr ago' },
  { id: 'n-006', title: 'Scheduled Maintenance', message: 'Platform maintenance window: July 6, 2–4 AM UTC. Brief downtime expected.', type: 'info', read: true, timestamp: '5 hr ago' },
  { id: 'n-007', title: 'API Rate Limit Alert', message: 'DataExtractor reached 85% of OpenAI API quota. Throttling may begin soon.', type: 'warning', read: true, timestamp: '6 hr ago' },
  { id: 'n-008', title: 'Knowledge Base Sync', message: 'Successfully indexed 24 new documents from Confluence integration.', type: 'success', read: true, timestamp: '8 hr ago' },
];

export const users: User[] = [
  { id: 'u-001', name: 'Sarah Chen', email: 'sarah@acme.com', role: 'admin', status: 'active', lastActive: 'Just now', avatar: 'SC' },
  { id: 'u-002', name: 'Mike Torres', email: 'mike@acme.com', role: 'developer', status: 'active', lastActive: '12 min ago', avatar: 'MT' },
  { id: 'u-003', name: 'Emily Rodriguez', email: 'emily@acme.com', role: 'editor', status: 'active', lastActive: '1 hr ago', avatar: 'ER' },
  { id: 'u-004', name: 'Alex Johnson', email: 'alex@acme.com', role: 'developer', status: 'active', lastActive: '3 hr ago', avatar: 'AJ' },
  { id: 'u-005', name: 'Jordan Lee', email: 'jordan@acme.com', role: 'viewer', status: 'inactive', lastActive: '2 days ago', avatar: 'JL' },
  { id: 'u-006', name: 'Chris Park', email: 'chris@acme.com', role: 'editor', status: 'pending', lastActive: 'Never', avatar: 'CP' },
  { id: 'u-007', name: 'Taylor Kim', email: 'taylor@acme.com', role: 'admin', status: 'active', lastActive: '45 min ago', avatar: 'TK' },
];

export const integrations: Integration[] = [
  { id: 'int-001', name: 'OpenAI', category: 'AI Models', status: 'connected', description: 'GPT-4o, GPT-4o-mini, Embeddings', icon: 'O', lastSync: '2 min ago' },
  { id: 'int-002', name: 'Anthropic', category: 'AI Models', status: 'connected', description: 'Claude 3.5 Sonnet, Claude 3 Opus', icon: 'A', lastSync: '5 min ago' },
  { id: 'int-003', name: 'Slack', category: 'Communication', status: 'connected', description: 'Send notifications to channels', icon: 'S', lastSync: '10 min ago' },
  { id: 'int-004', name: 'GitHub', category: 'Development', status: 'connected', description: 'PR reviews and code analysis', icon: 'G', lastSync: '1 hr ago' },
  { id: 'int-005', name: 'Salesforce', category: 'CRM', status: 'connected', description: 'Lead and contact management', icon: 'SF', lastSync: '15 min ago' },
  { id: 'int-006', name: 'Twitter/X', category: 'Social Media', status: 'error', description: 'OAuth token expired', icon: 'X', lastSync: '1 hr ago' },
  { id: 'int-007', name: 'Confluence', category: 'Knowledge', status: 'connected', description: 'Sync docs to knowledge base', icon: 'C', lastSync: '8 hr ago' },
  { id: 'int-008', name: 'Stripe', category: 'Billing', status: 'connected', description: 'Payment processing', icon: 'ST', lastSync: '3 hr ago' },
  { id: 'int-009', name: 'Zendesk', category: 'Support', status: 'disconnected', description: 'Customer support ticketing', icon: 'Z', lastSync: 'Never' },
  { id: 'int-010', name: 'HubSpot', category: 'CRM', status: 'disconnected', description: 'Marketing automation', icon: 'H', lastSync: 'Never' },
  { id: 'int-011', name: 'Google Analytics', category: 'Analytics', status: 'connected', description: 'Website traffic insights', icon: 'GA', lastSync: '1 hr ago' },
  { id: 'int-012', name: 'Pinecone', category: 'Vector DB', status: 'connected', description: 'Vector similarity search', icon: 'P', lastSync: '5 min ago' },
];

export const chartData = {
  taskVolume: [
    { label: 'Mon', value: 4200 },
    { label: 'Tue', value: 5800 },
    { label: 'Wed', value: 5100 },
    { label: 'Thu', value: 6900 },
    { label: 'Fri', value: 7400 },
    { label: 'Sat', value: 3200 },
    { label: 'Sun', value: 2800 },
  ],
  tokenUsage: [
    { label: 'Jan', value: 12 },
    { label: 'Feb', value: 18 },
    { label: 'Mar', value: 24 },
    { label: 'Apr', value: 19 },
    { label: 'May', value: 31 },
    { label: 'Jun', value: 42 },
    { label: 'Jul', value: 38 },
  ],
  successRate: [
    { label: 'Mon', value: 96.2 },
    { label: 'Tue', value: 97.8 },
    { label: 'Wed', value: 95.1 },
    { label: 'Thu', value: 98.3 },
    { label: 'Fri', value: 97.1 },
    { label: 'Sat', value: 98.9 },
    { label: 'Sun', value: 96.4 },
  ],
};

export const prompts = [
  { id: 'p-001', name: 'Blog Post Writer', category: 'Content', model: 'GPT-4o', uses: 4231, lastModified: '2 days ago', status: 'active', version: 'v3.2', tokens: 840 },
  { id: 'p-002', name: 'Support Response', category: 'Customer Service', model: 'GPT-4o-mini', uses: 12890, lastModified: '5 hr ago', status: 'active', version: 'v1.8', tokens: 320 },
  { id: 'p-003', name: 'Code Review Checklist', category: 'Engineering', model: 'Claude 3.5', uses: 892, lastModified: '1 week ago', status: 'active', version: 'v2.1', tokens: 1200 },
  { id: 'p-004', name: 'Lead Qualification', category: 'Sales', model: 'GPT-4o', uses: 3401, lastModified: '3 days ago', status: 'active', version: 'v4.0', tokens: 560 },
  { id: 'p-005', name: 'Email Subject Lines', category: 'Marketing', model: 'GPT-4o-mini', uses: 8920, lastModified: '1 day ago', status: 'draft', version: 'v1.1', tokens: 180 },
  { id: 'p-006', name: 'Legal Document Summary', category: 'Legal', model: 'Claude 3.5', uses: 234, lastModified: '2 weeks ago', status: 'active', version: 'v2.5', tokens: 2100 },
  { id: 'p-007', name: 'Product Description', category: 'E-commerce', model: 'GPT-4o-mini', uses: 6789, lastModified: '4 hr ago', status: 'active', version: 'v3.0', tokens: 420 },
];

export const tools = [
  { id: 't-001', name: 'Web Search', type: 'Search', status: 'active', calls: 45231, successRate: 98.1, description: 'Real-time web search via SerpAPI', auth: 'API Key', latency: '420ms' },
  { id: 't-002', name: 'Code Executor', type: 'Compute', status: 'active', calls: 8921, successRate: 95.4, description: 'Sandboxed Python/JS code execution', auth: 'None', latency: '1.2s' },
  { id: 't-003', name: 'Database Query', type: 'Data', status: 'active', calls: 23401, successRate: 99.7, description: 'Read/write to PostgreSQL databases', auth: 'OAuth', latency: '89ms' },
  { id: 't-004', name: 'Email Sender', type: 'Communication', status: 'active', calls: 12890, successRate: 97.2, description: 'Send emails via SendGrid', auth: 'API Key', latency: '340ms' },
  { id: 't-005', name: 'Image Analyzer', type: 'Vision', status: 'active', calls: 5432, successRate: 94.8, description: 'Analyze and describe images using GPT-4V', auth: 'API Key', latency: '890ms' },
  { id: 't-006', name: 'PDF Extractor', type: 'Document', status: 'maintenance', calls: 7821, successRate: 91.3, description: 'Extract text and structure from PDFs', auth: 'None', latency: '2.1s' },
  { id: 't-007', name: 'Slack Notifier', type: 'Communication', status: 'active', calls: 34201, successRate: 99.1, description: 'Post messages to Slack channels', auth: 'OAuth', latency: '210ms' },
  { id: 't-008', name: 'Calendar Manager', type: 'Productivity', status: 'inactive', calls: 1203, successRate: 96.5, description: 'Create and manage calendar events', auth: 'OAuth', latency: '520ms' },
];

export const knowledgeDocs = [
  { id: 'k-001', title: 'Q2 Product Roadmap', source: 'Confluence', chunks: 42, tokens: 18400, indexed: '2 days ago', status: 'indexed', category: 'Product' },
  { id: 'k-002', title: 'Customer Support Handbook', source: 'Upload', chunks: 128, tokens: 56000, indexed: '1 week ago', status: 'indexed', category: 'Support' },
  { id: 'k-003', title: 'Engineering Best Practices', source: 'GitHub', chunks: 89, tokens: 38200, indexed: '3 days ago', status: 'indexed', category: 'Engineering' },
  { id: 'k-004', title: 'Sales Playbook 2026', source: 'Upload', chunks: 67, tokens: 29800, indexed: '5 days ago', status: 'indexed', category: 'Sales' },
  { id: 'k-005', title: 'Legal & Compliance Guide', source: 'Confluence', chunks: 201, tokens: 87400, indexed: '1 month ago', status: 'indexed', category: 'Legal' },
  { id: 'k-006', title: 'Brand Voice Guidelines', source: 'Upload', chunks: 23, tokens: 9800, indexed: '2 weeks ago', status: 'indexed', category: 'Marketing' },
  { id: 'k-007', title: 'API Documentation v3', source: 'GitHub', chunks: 312, tokens: 134000, indexed: '1 day ago', status: 'processing', category: 'Engineering' },
  { id: 'k-008', title: 'Financial Reports FY2025', source: 'Upload', chunks: 0, tokens: 0, indexed: 'In progress', status: 'processing', category: 'Finance' },
];

export const memoryEntries = [
  { id: 'm-001', agent: 'SupportAgent', type: 'Episodic', content: 'Customer John D. prefers email communication over phone. Had 3 previous support tickets resolved.', created: '1 hr ago', expires: 'Never', tokens: 48 },
  { id: 'm-002', agent: 'ContentBot Pro', type: 'Semantic', content: 'Acme Corp brand voice: professional yet approachable. Avoid jargon. Use active voice. Oxford comma required.', created: '2 days ago', expires: 'Never', tokens: 62 },
  { id: 'm-003', agent: 'ResearchBot', type: 'Procedural', content: 'For competitor analysis: always check G2, Capterra, and Trustpilot first, then news sources. Summarize in SWOT format.', created: '1 week ago', expires: 'Never', tokens: 71 },
  { id: 'm-004', agent: 'SupportAgent', type: 'Episodic', content: 'Session context: User asked about refund policy. Escalated to Tier-2. Ticket #8820 references this conversation.', created: '3 hr ago', expires: '7 days', tokens: 54 },
  { id: 'm-005', agent: 'CodeReviewer', type: 'Semantic', content: 'Codebase uses React 18, TypeScript strict mode, Tailwind CSS. No default exports on components. Tests required for all utils.', created: '3 days ago', expires: 'Never', tokens: 68 },
  { id: 'm-006', agent: 'EmailDrafter', type: 'Episodic', content: 'Campaign "Summer Launch" targets SMB segment. 3 follow-ups max. Use subject line variant A (higher open rate: 31%).', created: '5 days ago', expires: '30 days', tokens: 57 },
];
