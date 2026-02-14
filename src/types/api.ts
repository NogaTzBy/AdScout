/**
 * Shared types and utilities for AdScout
 */

export type Country = 'BR' | 'MX' | 'CO' | 'CL' | 'US' | 'AR';
export type RunStatus = 'in_progress' | 'completed' | 'error';
export type CandidateStatus = 'pending' | 'approved_for_ar' | 'rejected';
export type ARValidationStatus = 'not_replicated' | 'replicated' | 'highly_replicated';

export const COUNTRY_LANGUAGES: Record<Country, string> = {
    BR: 'PT',
    MX: 'ES',
    CO: 'ES',
    CL: 'ES',
    US: 'EN',
    AR: 'ES',
};

export const COUNTRY_NAMES: Record<Country, string> = {
    BR: 'Brazil',
    MX: 'Mexico',
    CO: 'Colombia',
    CL: 'Chile',
    US: 'United States',
    AR: 'Argentina',
};

export interface CreateRunRequest {
    country: Country;
    keywords: string[];
    filters?: {
        minActiveAds?: number;
        minUniproductRatio?: number;
        minDuplicatesScore?: number;
    };
}

export interface CreateRunResponse {
    runId: string;
    status: RunStatus;
    message: string;
}

export interface GetRunResponse {
    id: string;
    country: Country;
    language: string;
    keywords: string[];
    status: RunStatus;
    createdAt: string;
    finishedAt?: string;
    candidatesCount: number;
}

export interface CandidateResponse {
    id: string;
    advertiserName: string;
    productDetected?: string;
    activeAdsCount: number;
    uniproductRatio: number;
    duplicatesScore: number;
    totalScore: number;
    validationReasons: string;
    status: CandidateStatus;
    adLibraryPageUrl?: string;
}
