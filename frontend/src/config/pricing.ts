// SiteScout Pricing Plans Configuration - Updated
// Centralized source of truth for all plan features and limits

export interface PlanFeatures {
    id: string;
    name: string;
    displayName: string;
    monthlyPrice: number;
    yearlyPrice: number;
    description: string;
    trialDays: number;
    features: string[];
    limits: {
        dailySearches: number; // -1 = unlimited
        dailyCities: number; // -1 = unlimited
        monthlyExports: number; // total CSV + JSON
        bulkExportSize: number; // max businesses per export
        savedLeads: number; // -1 = unlimited
        monthlyAIEmails: number;
        aiTemplates: number;
        teamMembers: number;
        canExport: boolean;
        canUseAI: boolean;
        canSaveBusinesses: boolean;
        exportFormats: string[];
    };
    support: string;
    supportResponseTime: string;
    popular?: boolean;
}

export const PRICING_PLANS: PlanFeatures[] = [
    {
        id: 'starter',
        name: 'starter',
        displayName: 'Starter (Free)',
        monthlyPrice: 0,
        yearlyPrice: 0,
        description: 'Perfect for testing SiteScout before upgrading',
        trialDays: 0,
        features: [
            '10 searches per day',
            '1 city per day',
            'Basic business info (name, address, category)',
            'Website detection (yes/no only)',
            'Presence score (limited data)',
            'No export',
            'No AI outreach',
            'No saved leads',
            'Rate-limited usage',
        ],
        limits: {
            dailySearches: 10,
            dailyCities: 1,
            monthlyExports: 0,
            bulkExportSize: 0,
            savedLeads: 0,
            monthlyAIEmails: 0,
            aiTemplates: 0,
            teamMembers: 1,
            canExport: false,
            canUseAI: false,
            canSaveBusinesses: false,
            exportFormats: [],
        },
        support: 'Email support',
        supportResponseTime: '48–72 hours',
    },
    {
        id: 'pro',
        name: 'pro',
        displayName: 'Pro',
        monthlyPrice: 149,
        yearlyPrice: 1490,
        description: 'For freelancers, local marketers, web designers, SEO specialists',
        trialDays: 7,
        popular: true,
        features: [
            'Everything in Starter, plus:',
            'Unlimited city searches',
            '500 searches per day',
            '"Businesses Without Websites" filter',
            'Full presence scoring (detailed breakdown)',
            'Saved Leads (100 saved businesses)',
            '1,000 CSV exports per month',
            '1,000 JSON exports per month',
            'Bulk export (100 businesses at a time)',
            '200 AI emails per month',
            '10 AI templates',
            'Full-statistics dashboard',
            'Sorting: presence score, rating, last updated',
            'Grid + list view',
            'Priority email support (24–48 hrs)',
        ],
        limits: {
            dailySearches: 500,
            dailyCities: -1, // unlimited
            monthlyExports: 1000,
            bulkExportSize: 100,
            savedLeads: 100,
            monthlyAIEmails: 200,
            aiTemplates: 10,
            teamMembers: 1,
            canExport: true,
            canUseAI: true,
            canSaveBusinesses: true,
            exportFormats: ['csv', 'json'],
        },
        support: 'Priority email support',
        supportResponseTime: '24–48 hours',
    },
    {
        id: 'agency',
        name: 'agency',
        displayName: 'Agency',
        monthlyPrice: 249,
        yearlyPrice: 2490,
        description: 'For agencies working with multiple clients, large lead demand, sales teams',
        trialDays: 14,
        features: [
            'Everything in Pro, plus:',
            '2,500 searches per day',
            'Multi-city bulk search',
            'High-volume crawling mode',
            'Saved Leads (unlimited)',
            '10,000 CSV exports per month',
            '10,000 JSON exports per month',
            'Full bulk export (up to 1,000 at a time)',
            '1,000 AI outreach emails per month',
            '50 AI templates',
            'White-label email personalization',
            '3 team members included',
            'Team lead sharing',
            'Admin access + user roles (Coming Soon)',
            '1-on-1 onboarding call',
            'Priority support (same-day)',
        ],
        limits: {
            dailySearches: 2500,
            dailyCities: -1, // unlimited
            monthlyExports: 10000,
            bulkExportSize: 1000,
            savedLeads: -1, // unlimited
            monthlyAIEmails: 1000,
            aiTemplates: 50,
            teamMembers: 3,
            canExport: true,
            canUseAI: true,
            canSaveBusinesses: true,
            exportFormats: ['csv', 'json'],
        },
        support: 'Priority same-day support',
        supportResponseTime: 'Same day',
    },
    {
        id: 'founding',
        name: 'founding',
        displayName: 'Founding Member',
        monthlyPrice: 99,
        yearlyPrice: 1188,
        description: 'Limited-time offer for first 30 customers',
        trialDays: 7,
        features: [
            'Pro plan features at $99/month',
            'Price locked forever',
            'Exclusive founding member badge',
            'Early access to future features',
            'All Pro features included',
        ],
        limits: {
            dailySearches: 500,
            dailyCities: -1,
            monthlyExports: 1000,
            bulkExportSize: 100,
            savedLeads: 100,
            monthlyAIEmails: 200,
            aiTemplates: 10,
            teamMembers: 1,
            canExport: true,
            canUseAI: true,
            canSaveBusinesses: true,
            exportFormats: ['csv', 'json'],
        },
        support: 'Priority email support',
        supportResponseTime: '24–48 hours',
    },
];

// Helper functions
export function getPlanById(planId: string): PlanFeatures | undefined {
    return PRICING_PLANS.find(plan => plan.id === planId);
}

export function getPlanLimits(planId: string) {
    const plan = getPlanById(planId);
    return plan?.limits || PRICING_PLANS[0].limits;
}

export function canUserExport(planId: string): boolean {
    const plan = getPlanById(planId);
    return plan?.limits.canExport || false;
}

export function canUserUseAI(planId: string): boolean {
    const plan = getPlanById(planId);
    return plan?.limits.canUseAI || false;
}

export function canUserSaveBusinesses(planId: string): boolean {
    const plan = getPlanById(planId);
    return plan?.limits.canSaveBusinesses || false;
}
