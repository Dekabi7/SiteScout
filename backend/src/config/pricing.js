// Backend Pricing Configuration - Updated
// Matches frontend pricing.ts

const PLAN_LIMITS = {
    starter: {
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
    },
    pro: {
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
    },
    agency: {
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
    },
    founding: {
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
    },
};

const PLAN_PRICES = {
    pro: {
        monthly: 149,
        yearly: 1490, // ~2 months free
    },
    agency: {
        monthly: 249,
        yearly: 2490, // ~2 months free
    },
    founding: {
        monthly: 99,
        yearly: 1188,
    },
};

const TRIAL_DAYS = {
    starter: 0,
    pro: 7,
    agency: 14,
    founding: 7,
};

function getPlanLimits(planType) {
    return PLAN_LIMITS[planType] || PLAN_LIMITS.starter;
}

function canUserExport(planType) {
    const limits = getPlanLimits(planType);
    return limits.canExport;
}

function canUserUseAI(planType) {
    const limits = getPlanLimits(planType);
    return limits.canUseAI;
}

function canUserSaveBusinesses(planType) {
    const limits = getPlanLimits(planType);
    return limits.canSaveBusinesses;
}

function getDailySearchLimit(planType) {
    const limits = getPlanLimits(planType);
    return limits.dailySearches;
}

function getMonthlyExportLimit(planType) {
    const limits = getPlanLimits(planType);
    return limits.monthlyExports;
}

function getBulkExportSize(planType) {
    const limits = getPlanLimits(planType);
    return limits.bulkExportSize;
}

function getSavedLeadsLimit(planType) {
    const limits = getPlanLimits(planType);
    return limits.savedLeads;
}

function getMonthlyAIEmailLimit(planType) {
    const limits = getPlanLimits(planType);
    return limits.monthlyAIEmails;
}

function getTeamMemberLimit(planType) {
    const limits = getPlanLimits(planType);
    return limits.teamMembers;
}

module.exports = {
    PLAN_LIMITS,
    PLAN_PRICES,
    TRIAL_DAYS,
    getPlanLimits,
    canUserExport,
    canUserUseAI,
    canUserSaveBusinesses,
    getDailySearchLimit,
    getMonthlyExportLimit,
    getBulkExportSize,
    getSavedLeadsLimit,
    getMonthlyAIEmailLimit,
    getTeamMemberLimit,
};
