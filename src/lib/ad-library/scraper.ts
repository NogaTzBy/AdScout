/**
 * Ad Library Scraper
 * Scrapes Meta Ad Library for ads by country and keywords
 */

import puppeteer, { Browser, Page } from 'puppeteer';

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

const COUNTRY_CODES: Record<Country, string> = {
    BR: 'BR',
    MX: 'MX',
    CO: 'CO',
    CL: 'CL',
    US: 'US',
    AR: 'AR',
};

/**
 * Initialize Puppeteer browser
 */
async function initBrowser(): Promise<Browser> {
    return await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
        ],
    });
}

/**
 * Search Ad Library by keywords and country
 */
export async function searchAdsByKeywords(
    params: AdLibrarySearchParams
): Promise<Map<string, AdvertiserData>> {
    const { country, keywords, limit = 50 } = params;
    const browser = await initBrowser();

    try {
        const advertisersMap = new Map<string, AdvertiserData>();

        for (const keyword of keywords) {
            console.log(`Searching for keyword: "${keyword}" in ${country}`);

            const ads = await searchSingleKeyword(browser, country, keyword, limit);

            // Group ads by advertiser
            for (const ad of ads) {
                if (!advertisersMap.has(ad.advertiserName)) {
                    advertisersMap.set(ad.advertiserName, {
                        name: ad.advertiserName,
                        pageUrl: ad.advertiserPageUrl,
                        activeAdsCount: 0,
                        ads: [],
                    });
                }

                const advertiser = advertisersMap.get(ad.advertiserName)!;
                advertiser.ads.push(ad);
                if (ad.isActive) {
                    advertiser.activeAdsCount++;
                }
            }
        }

        return advertisersMap;
    } finally {
        await browser.close();
    }
}

/**
 * Search for a single keyword
 */
async function searchSingleKeyword(
    browser: Browser,
    country: Country,
    keyword: string,
    limit: number
): Promise<AdData[]> {
    const page = await browser.newPage();

    try {
        // Set viewport and user agent
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent(
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        // Construct Ad Library URL
        const countryCode = COUNTRY_CODES[country];
        const encodedKeyword = encodeURIComponent(keyword);
        const url = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${countryCode}&q=${encodedKeyword}&search_type=keyword_unordered`;

        console.log(`Navigating to: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Wait for ads to load
        await new Promise(r => setTimeout(r, 3000));

        // Scroll to load more ads
        await autoScroll(page);

        // Extract ad data
        const ads = await page.evaluate((limitAds) => {
            const adElements = document.querySelectorAll('[data-testid="search_result_ad"]');
            const extractedAds: any[] = [];

            for (let i = 0; i < Math.min(adElements.length, limitAds); i++) {
                const adElement = adElements[i];

                try {
                    // Extract advertiser name
                    const advertiserElement = adElement.querySelector('[role="link"]');
                    const advertiserName = advertiserElement?.textContent?.trim() || 'Unknown';

                    // Extract advertiser page URL
                    const advertiserHref = advertiserElement?.getAttribute('href') || '';
                    const advertiserPageUrl = advertiserHref.startsWith('http')
                        ? advertiserHref
                        : `https://www.facebook.com${advertiserHref}`;

                    // Extract ad text
                    const adTextElement = adElement.querySelector('[data-testid="ad_creative_body"]');
                    const adText = adTextElement?.textContent?.trim() || '';

                    // Extract images
                    const imageElements = adElement.querySelectorAll('img[src*="scontent"]');
                    const imageUrls = Array.from(imageElements).map(img => img.getAttribute('src')).filter(Boolean) as string[];

                    // Extract videos (if any)
                    const videoElements = adElement.querySelectorAll('video');
                    const videoUrls = Array.from(videoElements).map(video => video.getAttribute('src')).filter(Boolean) as string[];

                    // Extract landing page URL
                    const landingPageElement = adElement.querySelector('a[href*="l.facebook.com"]');
                    const landingPageUrl = landingPageElement?.getAttribute('href') || undefined;

                    // Extract start date
                    const dateElement = adElement.querySelector('[data-testid="ad_start_date"]');
                    const startDate = dateElement?.textContent?.trim() || new Date().toISOString();

                    // Check if active (rough heuristic)
                    const isActive = !adElement.textContent?.toLowerCase().includes('inactive');

                    extractedAds.push({
                        adId: `ad_${i}_${Date.now()}`,
                        advertiserName,
                        advertiserPageUrl,
                        adText,
                        imageUrls,
                        videoUrls,
                        landingPageUrl,
                        startDate,
                        isActive,
                    });
                } catch (error) {
                    console.error('Error extracting ad data:', error);
                }
            }

            return extractedAds;
        }, limit);

        console.log(`Found ${ads.length} ads for keyword "${keyword}"`);
        return ads;
    } catch (error) {
        console.error(`Error searching for keyword "${keyword}":`, error);
        return [];
    } finally {
        await page.close();
    }
}

/**
 * Auto-scroll page to load more content
 */
async function autoScroll(page: Page): Promise<void> {
    await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

/**
 * Get active ads for a specific advertiser
 */
export async function getAdvertiserActiveAds(
    advertiserPageUrl: string,
    country: Country
): Promise<AdData[]> {
    const browser = await initBrowser();

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        // Navigate to advertiser's ad library page
        const pageId = extractPageIdFromUrl(advertiserPageUrl);
        const countryCode = COUNTRY_CODES[country];
        const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${countryCode}&view_all_page_id=${pageId}`;

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));

        // Extract ads (similar to searchSingleKeyword but simplified)
        const ads = await page.evaluate(() => {
            const adElements = document.querySelectorAll('[data-testid="search_result_ad"]');
            return adElements.length;
        });

        await page.close();

        // For now, return count as metadata (full implementation can extract actual ads)
        return [];
    } catch (error) {
        console.error('Error getting advertiser active ads:', error);
        return [];
    } finally {
        await browser.close();
    }
}

/**
 * Extract page ID from Facebook URL
 */
function extractPageIdFromUrl(url: string): string {
    const match = url.match(/\/(\d+)\/?/);
    return match ? match[1] : '';
}

/**
 * Simple rate limiter to avoid being blocked
 */
export async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
