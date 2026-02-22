import { searchAdsByKeywords } from './src/lib/ad-library/scraper';

async function run() {
  try {
    const results = await searchAdsByKeywords({ country: 'BR', keywords: ['ebook'], limit: 10 });
    console.log(`Found ${results.length} results`);
  } catch (err) {
    console.error('Scraper Error:', err);
  }
}
run();
