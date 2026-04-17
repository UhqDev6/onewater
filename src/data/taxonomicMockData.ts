export type TaxonEntry = {
  sample_id: string;
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  taxon: string;
  relative_frequency: number;
};

type AvailableMockLevel = 1 | 2 | 3 | 4;

const SAMPLE_IDS = Array.from({ length: 20 }, (_, index) => `L${String(index + 1).padStart(2, '0')}`);

const LEVEL_TAXA: Record<AvailableMockLevel, string[]> = {
  1: ['k__Bacteria', 'k__Archaea', 'k__Unassigned'],
  2: [
    'p__Firmicutes',
    'p__Bacteroidetes',
    'p__Proteobacteria',
    'p__Actinobacteria',
    'p__Fusobacteria',
    'p__Cyanobacteria',
    'p__Verrucomicrobia',
    'p__Unassigned',
  ],
  3: [
    'c__Bacteroidia',
    'c__Clostridia',
    'c__Bacilli',
    'c__Gammaproteobacteria',
    'c__Betaproteobacteria',
    'c__Actinobacteria',
    'c__Fusobacteriia',
    'c__Alphaproteobacteria',
    'c__Chloroplast',
    'c__Flavobacteriia',
    'c__Erysipelotrichi',
    'c__Unassigned',
  ],
  4: [
    'o__Clostridiales',
    'o__Bacteroidales',
    'o__Lactobacillales',
    'o__Pseudomonadales',
    'o__Burkholderiales',
    'o__Actinomycetales',
    'o__Fusobacteriales',
    'o__Unassigned',
  ],
};

const BASE_WEIGHTS: Record<AvailableMockLevel, number[]> = {
  1: [82, 10, 8],
  2: [18, 16, 20, 11, 9, 8, 7, 11],
  3: [11, 10, 9, 11, 9, 8, 7, 8, 7, 8, 6, 6],
  4: [17, 16, 14, 13, 12, 11, 8, 9],
};

function buildSampleWeights(level: AvailableMockLevel, sampleIndex: number): number[] {
  const bases = BASE_WEIGHTS[level];

  return bases.map((base, taxonIndex) => {
    const waveA = ((sampleIndex + 1) * (taxonIndex + 3)) % 7;
    const waveB = ((sampleIndex + 4) * (taxonIndex + 5)) % 5;
    const trend = (sampleIndex % 4) - 1.5;
    const raw = base + waveA * 0.95 - waveB * 0.55 + trend * 0.4;
    return Math.max(raw, 0.25);
  });
}

function normalizeToTenThousand(weights: number[]): number[] {
  const total = weights.reduce((sum, value) => sum + value, 0);
  const scaled = weights.map((value) => (value / total) * 10000);
  const floors = scaled.map((value) => Math.floor(value));
  let remainder = 10000 - floors.reduce((sum, value) => sum + value, 0);

  const indicesByFractionDesc = scaled
    .map((value, index) => ({ index, fraction: value - floors[index] }))
    .sort((a, b) => b.fraction - a.fraction)
    .map((entry) => entry.index);

  for (let pointer = 0; remainder > 0; pointer += 1) {
    const index = indicesByFractionDesc[pointer % indicesByFractionDesc.length];
    floors[index] += 1;
    remainder -= 1;
  }

  return floors.map((value) => value / 10000);
}

function createLevelEntries(level: AvailableMockLevel): TaxonEntry[] {
  const taxa = LEVEL_TAXA[level];

  return SAMPLE_IDS.flatMap((sample_id, sampleIndex) => {
    const normalized = normalizeToTenThousand(buildSampleWeights(level, sampleIndex));

    return taxa.map((taxon, taxonIndex) => ({
      sample_id,
      level,
      taxon,
      relative_frequency: normalized[taxonIndex],
    }));
  });
}

export const taxonomicMockData: TaxonEntry[] = [
  ...createLevelEntries(1),
  ...createLevelEntries(2),
  ...createLevelEntries(3),
  ...createLevelEntries(4),
];

export function getDataForRecharts(
  data: TaxonEntry[],
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7,
  sortBy: string
): { sample_id: string; [taxon: string]: number | string }[] {
  const levelData = data.filter((entry) => entry.level === level);
  const taxa = Array.from(new Set(levelData.map((entry) => entry.taxon)));

  const sampleMap = new Map<string, { sample_id: string; [taxon: string]: number | string }>();

  for (const entry of levelData) {
    if (!sampleMap.has(entry.sample_id)) {
      const seed: { sample_id: string; [taxon: string]: number | string } = {
        sample_id: entry.sample_id,
      };

      for (const taxon of taxa) {
        seed[taxon] = 0;
      }

      sampleMap.set(entry.sample_id, seed);
    }

    const row = sampleMap.get(entry.sample_id);
    if (row) {
      row[entry.taxon] = Number((entry.relative_frequency * 100).toFixed(2));
    }
  }

  const rows = Array.from(sampleMap.values());
  const normalizedSortKey = sortBy === 'Sample ID' ? 'sample_id' : sortBy;

  rows.sort((left, right) => {
    if (normalizedSortKey === 'sample_id') {
      return String(left.sample_id).localeCompare(String(right.sample_id));
    }

    const leftValue = Number(left[normalizedSortKey] ?? 0);
    const rightValue = Number(right[normalizedSortKey] ?? 0);

    if (rightValue !== leftValue) {
      return rightValue - leftValue;
    }

    return String(left.sample_id).localeCompare(String(right.sample_id));
  });

  return rows;
}