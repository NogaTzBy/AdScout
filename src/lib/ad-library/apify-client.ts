import { ApifyClient } from 'apify-client';
import { Country, AdData, AdvertiserData } from './scraper';

// Default actor for Facebook Ads Library on Apify
const APIFY_ACTOR_ID = process.env.APIFY_ACTOR_ID || 'apify/facebook-ads-scraper';

export async function fetchFromApify(
    country: Country,
    keywords: string[],
    limit: number = 50
): Promise<Map<string, AdvertiserData>> {
    const token = process.env.APIFY_API_TOKEN;
    if (!token) {
        throw new Error('APIFY_API_TOKEN is not configured');
    }

    const client = new ApifyClient({ token });

    // We join keywords for the URL. For best results, use single keywords or valid FB query logic.
    const searchTerms = keywords.join(' ');
    // Important: we use search_type=keyword_unordered for general text e-commerce scraping!
    const startUrl = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${country}&q=${encodeURIComponent(searchTerms)}&search_type=keyword_unordered&media_type=all`;

    console.log(`[Apify] Starting actor ${APIFY_ACTOR_ID} for country: ${country}, search: "${searchTerms}"`);
    console.log(`[Apify] Target URL: ${startUrl}`);

    // Start the Actor and wait for it to finish
    const run = await client.actor(APIFY_ACTOR_ID).call({
        startUrls: [
            { url: startUrl }
        ],
        maxAds: limit,
        maxItems: limit, // Ensures we don't burn credits by scraping thousands of ads unconditionally
    });

    console.log(`[Apify] Run ${run.id} finished. Fetching dataset items...`);

    // Fetch the dataset items
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    console.log(`[Apify] Fetched ${items.length} raw items from dataset`);

    return mapApifyResultsToAdvertisers(items, country);
}

function mapApifyResultsToAdvertisers(
    items: any[],
    country: Country
): Map<string, AdvertiserData> {
    const map = new Map<string, AdvertiserData>();

    for (const item of items) {
        if (item.error) continue; // Skip Apify URL errors

        const name = item.pageName || 'Unknown';
        const pageId = item.pageId || '';
        const pageUrl = item.pageProfilePictureUrl || (pageId ? `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${country}&view_all_page_id=${pageId}` : '');

        if (!map.has(name)) {
            map.set(name, { name, pageUrl, activeAdsCount: 0, ads: [] });
        }

        const advertiser = map.get(name)!;

        // Extract Text
        let adText = '';
        if (item.snapshot?.body?.markup?.__html) {
            // Very simple HTML tag stripping to get plain text
            adText = item.snapshot.body.markup.__html.replace(/<[^>]*>?/gm, ' ').trim();
        } else if (item.snapshot?.title) {
            adText = item.snapshot.title;
        }

        // Extract Images
        const imageUrls = [];
        if (item.snapshot?.images && Array.isArray(item.snapshot.images)) {
            imageUrls.push(...item.snapshot.images.map((img: any) => img.originalImageUrl || img.resizedImageUrls?.[0] || ''));
        }

        // Extract Videos
        const videoUrls = [];
        if (item.snapshot?.videos && Array.isArray(item.snapshot.videos)) {
            videoUrls.push(...item.snapshot.videos.map((vid: any) => vid.videoHdUrl || vid.videoSdUrl || ''));
        }

        const landingPageUrl = item.snapshot?.ctaUrl || item.snapshot?.linkUrl || item.snapshot?.displayUrl || '';

        advertiser.ads.push({
            adId: item.id || item.adId || String(Math.random()),
            advertiserName: name,
            advertiserPageUrl: pageUrl,
            adText,
            imageUrls: imageUrls.filter(Boolean),
            videoUrls: videoUrls.filter(Boolean),
            landingPageUrl,
            startDate: item.startDate ? new Date(item.startDate * 1000).toISOString() : new Date().toISOString(),
            isActive: item.isActive === true || item.isActive === 'true',
        });

        advertiser.activeAdsCount++;
    }

    return map;
}
