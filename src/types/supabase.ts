// TypeScript types generated from Supabase schema
// This file will be auto-generated after applying schema to Supabase

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    email: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            plans: {
                Row: {
                    id: string
                    name: string
                    price: number
                    runs_per_month: number
                    keywords_per_run: number
                    enabled_countries: string[]
                    active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    price?: number
                    runs_per_month?: number
                    keywords_per_run?: number
                    enabled_countries?: string[]
                    active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    price?: number
                    runs_per_month?: number
                    keywords_per_run?: number
                    enabled_countries?: string[]
                    active?: boolean
                    created_at?: string
                }
            }
            runs: {
                Row: {
                    id: string
                    user_id: string
                    target_country: 'BR' | 'MX' | 'CO' | 'CL' | 'US' | 'AR'
                    language: string
                    keywords_input: string[]
                    keywords_generated: string[]
                    status: 'in_progress' | 'completed' | 'error'
                    filter_params: Json
                    summary_logs: string | null
                    created_at: string
                    finished_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    target_country: 'BR' | 'MX' | 'CO' | 'CL' | 'US' | 'AR'
                    language: string
                    keywords_input: string[]
                    keywords_generated?: string[]
                    status?: 'in_progress' | 'completed' | 'error'
                    filter_params?: Json
                    summary_logs?: string | null
                    created_at?: string
                    finished_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    target_country?: 'BR' | 'MX' | 'CO' | 'CL' | 'US' | 'AR'
                    language?: string
                    keywords_input?: string[]
                    keywords_generated?: string[]
                    status?: 'in_progress' | 'completed' | 'error'
                    filter_params?: Json
                    summary_logs?: string | null
                    created_at?: string
                    finished_at?: string | null
                }
            }
            external_candidates: {
                Row: {
                    id: string
                    run_id: string
                    keyword_origin: string
                    platform_origin: string
                    ad_library_page_url: string | null
                    advertiser_name: string
                    product_detected: string | null
                    active_ads_count: number
                    uniproduct_ratio: number
                    duplicates_score: number
                    total_score: number
                    validation_reasons: string | null
                    status: 'pending' | 'approved_for_ar' | 'rejected'
                    created_at: string
                }
                Insert: {
                    id?: string
                    run_id: string
                    keyword_origin: string
                    platform_origin?: string
                    ad_library_page_url?: string | null
                    advertiser_name: string
                    product_detected?: string | null
                    active_ads_count?: number
                    uniproduct_ratio?: number
                    duplicates_score?: number
                    total_score?: number
                    validation_reasons?: string | null
                    status?: 'pending' | 'approved_for_ar' | 'rejected'
                    created_at?: string
                }
                Update: {
                    id?: string
                    run_id?: string
                    keyword_origin?: string
                    platform_origin?: string
                    ad_library_page_url?: string | null
                    advertiser_name?: string
                    product_detected?: string | null
                    active_ads_count?: number
                    uniproduct_ratio?: number
                    duplicates_score?: number
                    total_score?: number
                    validation_reasons?: string | null
                    status?: 'pending' | 'approved_for_ar' | 'rejected'
                    created_at?: string
                }
            }
            ar_validations: {
                Row: {
                    id: string
                    candidate_id: string
                    status: 'not_replicated' | 'replicated' | 'highly_replicated'
                    similarity_score: number
                    similarity_explanation: string | null
                    signals_used: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    candidate_id: string
                    status?: 'not_replicated' | 'replicated' | 'highly_replicated'
                    similarity_score?: number
                    similarity_explanation?: string | null
                    signals_used?: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    candidate_id?: string
                    status?: 'not_replicated' | 'replicated' | 'highly_replicated'
                    similarity_score?: number
                    similarity_explanation?: string | null
                    signals_used?: Json
                    created_at?: string
                }
            }
            ar_replicators: {
                Row: {
                    id: string
                    ar_validation_id: string
                    advertiser_name: string
                    ad_library_page_url: string | null
                    active_ads_count: number
                    is_validated_advertiser: boolean
                    match_evidence: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    ar_validation_id: string
                    advertiser_name: string
                    ad_library_page_url?: string | null
                    active_ads_count?: number
                    is_validated_advertiser?: boolean
                    match_evidence?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    ar_validation_id?: string
                    advertiser_name?: string
                    ad_library_page_url?: string | null
                    active_ads_count?: number
                    is_validated_advertiser?: boolean
                    match_evidence?: string | null
                    created_at?: string
                }
            }
            upsell_extras: {
                Row: {
                    id: string
                    ar_validation_id: string
                    extra_name: string
                    reason: string
                    combo_logic: string | null
                    notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    ar_validation_id: string
                    extra_name: string
                    reason: string
                    combo_logic?: string | null
                    notes?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    ar_validation_id?: string
                    extra_name?: string
                    reason?: string
                    combo_logic?: string | null
                    notes?: string | null
                    created_at?: string
                }
            }
            creative_cache: {
                Row: {
                    id: string
                    image_url: string
                    image_hash: string | null
                    analysis_result: Json | null
                    analyzed_at: string
                }
                Insert: {
                    id?: string
                    image_url: string
                    image_hash?: string | null
                    analysis_result?: Json | null
                    analyzed_at?: string
                }
                Update: {
                    id?: string
                    image_url?: string
                    image_hash?: string | null
                    analysis_result?: Json | null
                    analyzed_at?: string
                }
            }
        }
        Views: {}
        Functions: {}
        Enums: {
            country_code: 'BR' | 'MX' | 'CO' | 'CL' | 'US' | 'AR'
            run_status: 'in_progress' | 'completed' | 'error'
            candidate_status: 'pending' | 'approved_for_ar' | 'rejected'
            ar_validation_status: 'not_replicated' | 'replicated' | 'highly_replicated'
        }
    }
}
