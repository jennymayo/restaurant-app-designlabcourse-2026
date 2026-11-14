import { newId } from '../lib/id'
import type { Place, Price, SourceType, Status } from '../types'
import { presetId } from './presetTags'

/**
 * SAMPLE DATA: about a dozen made-up Cincinnati-style places so you can
 * try the filters right away.
 *
 * The names are fictional (any resemblance to a real place is a coincidence),
 * and the links just open each site's home page. Every place is flagged
 * `isSample: true`, which is how the "Clear sample data" button knows what to remove.
 */

// The fields we write by hand for each sample. `tags` uses readable labels.
interface SampleSeed {
  name: string
  neighborhood: string
  sourceType: SourceType | null
  sourceUrl: string | null
  price: Price
  tags: string[]
  note: string
  status: Status
}

const SEEDS: SampleSeed[] = [
  {
    name: 'The Quiet Kettle',
    neighborhood: 'Clifton',
    sourceType: 'Instagram',
    sourceUrl: 'https://www.instagram.com/',
    price: '$',
    tags: ['cozy', 'quiet', 'reading or working', 'solo', 'vegetarian-friendly'],
    note: 'Tea and scones, an outlet at every table. Perfect for a post-shift wind down.',
    status: 'want',
  },
  {
    name: 'Findlay Row Biscuits',
    neighborhood: 'Over-the-Rhine',
    sourceType: 'TikTok',
    sourceUrl: 'https://www.tiktok.com/',
    price: '$',
    tags: ['brunch', 'hole-in-the-wall', 'friends outing', 'lively'],
    note: 'The giant biscuit sandwich from that video. Go early, there is a line.',
    status: 'want',
  },
  {
    name: 'Queen City Chili Parlor',
    neighborhood: 'Over-the-Rhine',
    sourceType: 'Google Maps',
    sourceUrl: 'https://maps.google.com/',
    price: '$',
    tags: ['hole-in-the-wall', 'late night', 'solo'],
    note: 'Three-way chili after a late shift. Cash only.',
    status: 'would-return',
  },
  {
    name: 'Lantern & Fig',
    neighborhood: 'Hyde Park',
    sourceType: 'Instagram',
    sourceUrl: 'https://www.instagram.com/',
    price: '$$$',
    tags: ['date night', 'cozy', 'trendy', 'gluten-free options'],
    note: 'Candlelit, small plates. Save for a real treat.',
    status: 'want',
  },
  {
    name: 'Pinecone Coffee Library',
    neighborhood: 'Northside',
    sourceType: 'Friend',
    sourceUrl: null,
    price: '$',
    tags: ['cozy', 'quiet', 'reading or working', 'solo', 'vegan-friendly', 'dessert'],
    note: 'A friend swears by the oat milk lavender latte. Shelves of free books.',
    status: 'would-return',
  },
  {
    name: 'Mt. Adams Social Rooftop',
    neighborhood: 'Mt. Adams',
    sourceType: 'Instagram',
    sourceUrl: 'https://www.instagram.com/',
    price: '$$$',
    tags: ['birthday', 'friends outing', 'lively', 'trendy'],
    note: 'City views. Good spot for the next birthday dinner.',
    status: 'want',
  },
  {
    name: 'Sweet Tooth Creamery',
    neighborhood: 'Oakley',
    sourceType: 'TikTok',
    sourceUrl: 'https://www.tiktok.com/',
    price: '$',
    tags: ['dessert', 'friends outing', 'lively'],
    note: 'Rotating flavors, the brown butter one was unreal.',
    status: 'visited',
  },
  {
    name: "Mama Rosa's Trattoria",
    neighborhood: 'Covington, KY',
    sourceType: 'Google Maps',
    sourceUrl: 'https://maps.google.com/',
    price: '$$',
    tags: ['date night', 'cozy', 'birthday', 'vegetarian-friendly'],
    note: 'Homemade pasta. Quick hop across the river.',
    status: 'visited',
  },
  {
    name: 'Green Table Kitchen',
    neighborhood: 'Over-the-Rhine',
    sourceType: 'Other',
    sourceUrl: null,
    price: '$$',
    tags: ['vegan-friendly', 'vegetarian-friendly', 'gluten-free options', 'friends outing', 'business lunch'],
    note: 'Big menu that works for everyone, whatever they eat.',
    status: 'want',
  },
  {
    name: 'Midnight Pierogi',
    neighborhood: 'Northside',
    sourceType: 'TikTok',
    sourceUrl: 'https://www.tiktok.com/',
    price: '$',
    tags: ['late night', 'hole-in-the-wall', 'lively', 'friends outing'],
    note: 'Open until 2am. Potato and cheddar pierogi, cheap.',
    status: 'want',
  },
  {
    name: 'Copper Spoon Bistro',
    neighborhood: 'Downtown',
    sourceType: 'Google Maps',
    sourceUrl: 'https://maps.google.com/',
    price: '$$$$',
    tags: ['business lunch', 'date night', 'birthday', 'gluten-free options'],
    note: 'Tasting menu. A once-a-year splurge.',
    status: 'want',
  },
  {
    name: 'Sunday Pages Café',
    neighborhood: 'Over-the-Rhine',
    sourceType: 'Google Maps',
    sourceUrl: 'https://maps.google.com/',
    price: '$$',
    tags: ['brunch', 'cozy', 'quiet', 'reading or working', 'solo', 'vegetarian-friendly'],
    note: 'Quiet corner booths and good brunch. Wifi password is on the menu.',
    status: 'want',
  },
]

/**
 * Build the sample places. A function (not a constant) so each call creates
 * fresh unique ids and timestamps.
 */
export function makeSamplePlaces(): Place[] {
  const now = Date.now()
  return SEEDS.map((seed, index) => {
    // Space the timestamps one minute apart so the order is stable.
    // The first sample is the "newest" so it shows first in the list.
    const timestamp = new Date(now - index * 60_000).toISOString()
    return {
      id: newId(),
      name: seed.name,
      neighborhood: seed.neighborhood,
      sourceUrl: seed.sourceUrl,
      sourceType: seed.sourceType,
      price: seed.price,
      note: seed.note,
      tagIds: seed.tags.map(presetId),
      status: seed.status,
      isSample: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
  })
}
