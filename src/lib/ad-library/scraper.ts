/**
 * Ad Library Client
 * Uses Meta's official Ad Library API — falls back to realistic mock data
 * when META_ACCESS_TOKEN is not set (useful for local dev/demo).
 */

export type Country = 'BR' | 'MX' | 'CO' | 'CL' | 'US' | 'AR';

export interface AdLibrarySearchParams {
    country: Country;
    keywords: string[];
    limit?: number;
}

export interface AdData {
    adId: string;
    advertiserName: string;
    advertiserPageUrl: string;
    adText: string;
    imageUrls: string[];
    videoUrls: string[];
    landingPageUrl?: string;
    startDate: string;
    isActive: boolean;
}

export interface AdvertiserData {
    name: string;
    pageUrl: string;
    activeAdsCount: number;
    ads: AdData[];
}

export async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/* ------------------------------------------------------------------ */
/*  META AD LIBRARY API                                                 */
/* ------------------------------------------------------------------ */

const META_API_BASE = 'https://graph.facebook.com/v21.0/ads_archive';

interface MetaAdRecord {
    id: string;
    page_name: string;
    page_id?: string;
    ad_creative_bodies?: string[];
    ad_creative_link_titles?: string[];
    ad_delivery_start_time?: string;
    ad_snapshot_url?: string;
    ad_creative_link_captions?: string[];
    estimated_audience_size?: { lower_bound: number; upper_bound: number };
}

interface MetaApiResponse {
    data: MetaAdRecord[];
    paging?: {
        cursors?: { after?: string };
        next?: string;
    };
}

async function fetchFromMetaApi(
    keyword: string,
    country: Country,
    limit: number,
    token: string
): Promise<MetaAdRecord[]> {
    // Meta Ad Library API requires ad_reached_countries as a JSON array string
    const params = new URLSearchParams({
        search_terms: keyword,
        ad_reached_countries: JSON.stringify([country]),   // ← ["BR"] not "BR"
        ad_type: 'ALL',
        ad_active_status: 'ALL',
        fields: [
            'id',
            'page_name',
            'page_id',
            'ad_creative_bodies',
            'ad_creative_link_titles',
            'ad_delivery_start_time',
            'ad_snapshot_url',
        ].join(','),
        limit: String(Math.min(limit, 100)),
        access_token: token,
    });

    const url = `${META_API_BASE}?${params.toString()}`;
    console.log(`[Meta API] GET ${META_API_BASE}?search_terms=${encodeURIComponent(keyword)}&ad_reached_countries=["${country}"]&...`);

    const res = await fetch(url, { next: { revalidate: 0 } });

    if (!res.ok) {
        const errorBody = await res.text();
        console.error(`[Meta API] Error ${res.status}: ${errorBody}`);
        throw new Error(`Meta API returned ${res.status}: ${errorBody}`);
    }

    const json: MetaApiResponse = await res.json();
    console.log(`[Meta API] Got ${json.data?.length ?? 0} records for "${keyword}"`);
    return json.data ?? [];
}

function metaRecordsToAdvertisers(
    records: MetaAdRecord[],
    country: Country
): Map<string, AdvertiserData> {
    const map = new Map<string, AdvertiserData>();

    for (const rec of records) {
        const name = rec.page_name || 'Unknown';
        const pageId = rec.page_id ?? '';
        const pageUrl = pageId
            ? `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${country}&view_all_page_id=${pageId}`
            : rec.ad_snapshot_url ?? '';

        if (!map.has(name)) {
            map.set(name, { name, pageUrl, activeAdsCount: 0, ads: [] });
        }

        const advertiser = map.get(name)!;
        const adText =
            rec.ad_creative_bodies?.[0] ??
            rec.ad_creative_link_titles?.[0] ??
            '';

        advertiser.ads.push({
            adId: rec.id,
            advertiserName: name,
            advertiserPageUrl: pageUrl,
            adText,
            imageUrls: [],
            videoUrls: [],
            landingPageUrl: rec.ad_snapshot_url,
            startDate: rec.ad_delivery_start_time ?? new Date().toISOString(),
            isActive: true,
        });
        advertiser.activeAdsCount++;
    }

    return map;
}

/* ------------------------------------------------------------------ */
/*  MOCK FALLBACK                                                       */
/* ------------------------------------------------------------------ */

const MOCK_ADVERTISERS: Record<string, Omit<AdvertiserData, 'ads'>[]> = {
    BR: [
        { name: 'NutriForce Brasil', pageUrl: 'https://facebook.com/nutriforce', activeAdsCount: 47 },
        { name: 'FitShop BR', pageUrl: 'https://facebook.com/fitshopbr', activeAdsCount: 31 },
        { name: 'Suplementos Pro', pageUrl: 'https://facebook.com/suplpro', activeAdsCount: 28 },
        { name: 'MaxMuscle Store', pageUrl: 'https://facebook.com/maxmuscle', activeAdsCount: 22 },
        { name: 'VidaActiva Brasil', pageUrl: 'https://facebook.com/vidaativa', activeAdsCount: 18 },
    ],
    MX: [
        { name: 'Proteína MX', pageUrl: 'https://facebook.com/protmx', activeAdsCount: 53 },
        { name: 'GymStore México', pageUrl: 'https://facebook.com/gymstore', activeAdsCount: 39 },
        { name: 'NutriMex Pro', pageUrl: 'https://facebook.com/nutrimex', activeAdsCount: 25 },
        { name: 'FitLife CDMX', pageUrl: 'https://facebook.com/fitlife', activeAdsCount: 20 },
    ],
    AR: [
        { name: 'MuscleAR', pageUrl: 'https://facebook.com/musclear', activeAdsCount: 35 },
        { name: 'Suplementos BA', pageUrl: 'https://facebook.com/suplba', activeAdsCount: 27 },
        { name: 'FitStore Argentina', pageUrl: 'https://facebook.com/fitar', activeAdsCount: 19 },
    ],
    CO: [
        { name: 'NutriCo Colombia', pageUrl: 'https://facebook.com/nutrico', activeAdsCount: 29 },
        { name: 'ProFit Bogotá', pageUrl: 'https://facebook.com/profitbo', activeAdsCount: 21 },
    ],
    CL: [
        { name: 'FitCenter Chile', pageUrl: 'https://facebook.com/fitcl', activeAdsCount: 33 },
        { name: 'MuscleCL', pageUrl: 'https://facebook.com/musclecl', activeAdsCount: 24 },
    ],
    US: [
        { name: 'ProteinWorld US', pageUrl: 'https://facebook.com/pwus', activeAdsCount: 78 },
        { name: 'GNC Official', pageUrl: 'https://facebook.com/gnc', activeAdsCount: 62 },
        { name: 'Bodybuilding.com', pageUrl: 'https://facebook.com/bbcom', activeAdsCount: 55 },
    ],
};

function generateMockAdvertisers(
    keywords: string[],
    country: Country,
    limit: number
): Map<string, AdvertiserData> {
    const pool = MOCK_ADVERTISERS[country] ?? MOCK_ADVERTISERS['BR'];
    const map = new Map<string, AdvertiserData>();

    const selected = pool.slice(0, Math.min(limit, pool.length));

    for (const base of selected) {
        const adTexts = keywords.flatMap(kw => [
            `🔥 Los mejores productos de ${kw}. Envío gratis. ¡Oferta por tiempo limitado!`,
            `Transforma tu cuerpo con nuestra línea ${kw}. Calidad garantizada.`,
            `${kw} profesional directo de fábrica. Precio especial hoy.`,
        ]);

        const ads: AdData[] = adTexts.map((text, i) => ({
            adId: `mock_${base.name}_${i}`,
            advertiserName: base.name,
            advertiserPageUrl: base.pageUrl,
            adText: text,
            imageUrls: [],
            videoUrls: [],
            startDate: new Date(Date.now() - i * 86400000 * 5).toISOString(),
            isActive: true,
        }));

        map.set(base.name, {
            ...base,
            ads,
        });
    }

    return map;
}

/* ------------------------------------------------------------------ */
/*  PUBLIC ENTRY POINT                                                  */
/* ------------------------------------------------------------------ */

import { fetchFromApify } from './apify-client';

export async function searchAdsByKeywords(
    params: AdLibrarySearchParams
): Promise<Map<string, AdvertiserData>> {
    const { country, keywords, limit = 50 } = params;

    // Use Apify Client to get realistic scraping data
    console.log(`[AdLibrary] Delegating search to Apify for ${keywords.length} keywords in ${country}`);

    try {
        const advertisersMap = await fetchFromApify(country, keywords, limit);
        return advertisersMap;
    } catch (error) {
        console.error('[AdLibrary] Apify execution failed:', error);
        throw error; // Let the route handler catch this
    }
}
