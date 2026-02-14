/**
 * Ad Library Validator
 * Validates advertisers based on criteria: active ads, uniproduct ratio, duplicates
 */

import type { AdvertiserData, AdData } from './scraper';

export interface ValidationMetrics {
    activeAdsCount: number;
    uniproductRatio: number; // 0-1
    duplicatesScore: number; // 0-1
    totalScore: number; // 0-100
    reasons: string[];
    passed: boolean;
}

export interface ValidationCriteria {
    minActiveAds: number;
    minUniproductRatio: number; // 0.8 = 80%
    minDuplicatesScore: number; // 0.3 = 30% duplicates
}

const DEFAULT_CRITERIA: ValidationCriteria = {
    minActiveAds: 20,
    minUniproductRatio: 0.8, // 80-90% concentrated on one product
    minDuplicatesScore: 0.3, // At least 30% duplicates
};

/**
 * Validate an advertiser against criteria
 */
export function validateAdvertiser(
    advertiser: AdvertiserData,
    criteria: ValidationCriteria = DEFAULT_CRITERIA
): ValidationMetrics {
    const reasons: string[] = [];

    // 1. Active ads count
    const activeAdsCount = advertiser.activeAdsCount;
    const activeAdsPassed = activeAdsCount >= criteria.minActiveAds;

    if (activeAdsPassed) {
        reasons.push(`✓ Has ${activeAdsCount} active ads (≥${criteria.minActiveAds})`);
    } else {
        reasons.push(`✗ Only ${activeAdsCount} active ads (<${criteria.minActiveAds})`);
    }

    // 2. Uniproduct ratio
    const uniproductRatio = detectUniproduct(advertiser.ads);
    const uniproductPassed = uniproductRatio >= criteria.minUniproductRatio;

    if (uniproductPassed) {
        reasons.push(`✓ Uniproduct ratio ${(uniproductRatio * 100).toFixed(0)}% (≥${criteria.minUniproductRatio * 100}%)`);
    } else {
        reasons.push(`✗ Uniproduct ratio ${(uniproductRatio * 100).toFixed(0)}% (<${criteria.minUniproductRatio * 100}%)`);
    }

    // 3. Duplicates score
    const duplicatesScore = detectDuplicates(advertiser.ads);
    const duplicatesPassed = duplicatesScore >= criteria.minDuplicatesScore;

    if (duplicatesPassed) {
        reasons.push(`✓ Duplicates score ${(duplicatesScore * 100).toFixed(0)}% (≥${criteria.minDuplicatesScore * 100}%)`);
    } else {
        reasons.push(`✗ Duplicates score ${(duplicatesScore * 100).toFixed(0)}% (<${criteria.minDuplicatesScore * 100}%)`);
    }

    // Calculate overall score (0-100)
    const activeScore = activeAdsPassed ? 40 : (activeAdsCount / criteria.minActiveAds) * 40;
    const uniproductScore = uniproductRatio * 30;
    const duplicatesScoreWeighted = duplicatesScore * 30;

    const totalScore = Math.round(activeScore + uniproductScore + duplicatesScoreWeighted);
    const passed = activeAdsPassed && uniproductPassed && duplicatesPassed;

    return {
        activeAdsCount,
        uniproductRatio,
        duplicatesScore,
        totalScore,
        reasons,
        passed,
    };
}

/**
 * Detect if advertiser is uniproduct (80-90% ads about one product)
 * Returns ratio 0-1
 */
export function detectUniproduct(ads: AdData[]): number {
    if (ads.length === 0) return 0;

    // Group ads by similarity of ad text
    const productGroups = new Map<string, number>();

    for (const ad of ads) {
        // Extract potential product name from ad text (first significant phrase)
        const productKey = extractProductKey(ad.adText);
        productGroups.set(productKey, (productGroups.get(productKey) || 0) + 1);
    }

    // Find largest group
    let maxCount = 0;
    for (const count of productGroups.values()) {
        if (count > maxCount) {
            maxCount = count;
        }
    }

    // Ratio of largest group to total ads
    return maxCount / ads.length;
}

/**
 * Extract product key from ad text for grouping
 */
function extractProductKey(adText: string): string {
    if (!adText) return 'unknown';

    // Normalize text
    const normalized = adText
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ');

    // Extract first 3-5 significant words (rough heuristic)
    const words = normalized.split(' ').filter(w => w.length > 3);
    const key = words.slice(0, 5).join(' ');

    return key || 'unknown';
}

/**
 * Detect duplicates (same or very similar ads)
 * Returns score 0-1 (higher = more duplicates)
 */
export function detectDuplicates(ads: AdData[]): number {
    if (ads.length < 2) return 0;

    let duplicateCount = 0;
    const seenTexts = new Set<string>();
    const seenImages = new Set<string>();

    for (const ad of ads) {
        // Check text duplicates
        const normalizedText = normalizeText(ad.adText);
        if (seenTexts.has(normalizedText) && normalizedText.length > 10) {
            duplicateCount++;
        } else {
            seenTexts.add(normalizedText);
        }

        // Check image duplicates
        for (const imageUrl of ad.imageUrls) {
            const imageKey = extractImageKey(imageUrl);
            if (seenImages.has(imageKey)) {
                duplicateCount++;
            } else {
                seenImages.add(imageKey);
            }
        }
    }

    // Return ratio of duplicates to total ads
    return Math.min(duplicateCount / ads.length, 1);
}

/**
 * Normalize text for duplicate detection
 */
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Extract image key from URL for duplicate detection
 */
function extractImageKey(url: string): string {
    // Extract the unique hash/ID from Facebook CDN URL
    const match = url.match(/\/([a-f0-9]+)_/);
    return match ? match[1] : url;
}

/**
 * Calculate overall score for candidate
 */
export function calculateOverallScore(
    activeAdsCount: number,
    uniproductRatio: number,
    duplicatesScore: number,
    criteria: ValidationCriteria = DEFAULT_CRITERIA
): number {
    const activeScore = Math.min((activeAdsCount / criteria.minActiveAds) * 40, 40);
    const uniproductScore = uniproductRatio * 30;
    const duplicatesScoreWeighted = duplicatesScore * 30;

    return Math.round(activeScore + uniproductScore + duplicatesScoreWeighted);
}

/**
 * Batch validate multiple advertisers
 */
export function batchValidate(
    advertisers: AdvertiserData[],
    criteria: ValidationCriteria = DEFAULT_CRITERIA
): Map<string, ValidationMetrics> {
    const results = new Map<string, ValidationMetrics>();

    for (const advertiser of advertisers) {
        const metrics = validateAdvertiser(advertiser, criteria);
        results.set(advertiser.name, metrics);
    }

    return results;
}
