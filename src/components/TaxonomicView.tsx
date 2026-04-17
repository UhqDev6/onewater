'use client';

import { ReactNode, useMemo, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getDataForRecharts, taxonomicMockData } from '@/data/taxonomicMockData';

type TaxonomicLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type SortOrder = 'asc' | 'desc';
type PaletteName = 'default' | 'colorblind-safe' | 'warm' | 'cool';

const ALL_LEVELS: TaxonomicLevel[] = [1, 2, 3, 4, 5, 6, 7];

const LEVEL_RANK_LABELS: Record<TaxonomicLevel, string> = {
  1: 'Kingdom',
  2: 'Phylum',
  3: 'Class',
  4: 'Order',
  5: 'Family',
  6: 'Genus',
  7: 'Species',
};

const COLOR_PALETTES: Record<PaletteName, string[]> = {
  default: ['#2563eb', '#7c3aed', '#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444', '#22c55e', '#8b5cf6', '#64748b'],
  'colorblind-safe': ['#0072B2', '#009E73', '#D55E00', '#CC79A7', '#F0E442', '#56B4E9', '#E69F00', '#999999', '#332288'],
  warm: ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#fb7185', '#f43f5e', '#dc2626', '#ea580c', '#b45309'],
  cool: ['#0ea5e9', '#06b6d4', '#14b8a6', '#22c55e', '#3b82f6', '#6366f1', '#8b5cf6', '#64748b', '#10b981'],
};

function toDisplayTaxon(rawTaxon: string): string {
  return rawTaxon.replace(/^[kpcofgs]__/, '');
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function calculateShannonForSample(probabilities: number[]): number {
  return -probabilities.reduce((sum, probability) => {
    if (probability <= 0) {
      return sum;
    }
    return sum + probability * Math.log(probability);
  }, 0);
}

export default function TaxonomicView() {
  const [taxonomicLevel, setTaxonomicLevel] = useState<TaxonomicLevel>(2);
  const [sortBy, setSortBy] = useState<string>('sample_id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [palette, setPalette] = useState<PaletteName>('default');
  const [barWidth, setBarWidth] = useState<number>(20);
  const [hoverInfo, setHoverInfo] = useState<string | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const levelsWithData = useMemo(() => {
    return new Set(taxonomicMockData.map((entry) => entry.level as TaxonomicLevel));
  }, []);

  const taxaForCurrentLevel = useMemo(() => {
    return Array.from(
      new Set(
        taxonomicMockData
          .filter((entry) => entry.level === taxonomicLevel)
          .map((entry) => entry.taxon)
      )
    );
  }, [taxonomicLevel]);

  const chartData = useMemo(() => {
    const sorted = getDataForRecharts(taxonomicMockData, taxonomicLevel, sortBy);
    return sortOrder === 'asc' ? sorted : [...sorted].reverse();
  }, [taxonomicLevel, sortBy, sortOrder]);

  const colorByTaxon = useMemo(() => {
    const activePalette = COLOR_PALETTES[palette];
    return Object.fromEntries(
      taxaForCurrentLevel.map((taxon, index) => [taxon, activePalette[index % activePalette.length]])
    ) as Record<string, string>;
  }, [palette, taxaForCurrentLevel]);

  const taxonBySampleAndLevel = useMemo(() => {
    const result = new Map<string, Map<number, { taxon: string; relativeFrequency: number }>>();

    for (const entry of taxonomicMockData) {
      if (!result.has(entry.sample_id)) {
        result.set(entry.sample_id, new Map<number, { taxon: string; relativeFrequency: number }>());
      }

      const levelMap = result.get(entry.sample_id);
      const existing = levelMap?.get(entry.level);
      if (!existing || entry.relative_frequency > existing.relativeFrequency) {
        levelMap?.set(entry.level, {
          taxon: entry.taxon,
          relativeFrequency: entry.relative_frequency,
        });
      }
    }

    return result;
  }, []);

  const buildTaxonomicPath = (sampleId: string, currentTaxon: string): string => {
    const sampleLevels = taxonBySampleAndLevel.get(sampleId);
    const path: string[] = [];

    for (let level = 1; level <= taxonomicLevel; level += 1) {
      if (level === taxonomicLevel) {
        path.push(currentTaxon || 'Unassigned');
      } else {
        path.push(sampleLevels?.get(level)?.taxon ?? 'Unassigned');
      }
    }

    return path.join(';');
  };

  const handleBarMouseEnter = (barData: unknown, taxon: string): void => {
    const payload =
      barData && typeof barData === 'object' && 'payload' in barData
        ? (barData as { payload?: Record<string, unknown> }).payload
        : undefined;

    const sampleId = typeof payload?.sample_id === 'string' ? payload.sample_id : null;
    if (!sampleId) {
      setHoverInfo(null);
      return;
    }

    const rawValue = payload?.[taxon];
    const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue ?? 0);
    const percentValue = Number.isFinite(numericValue) ? numericValue : 0;
    const taxonomicPath = buildTaxonomicPath(sampleId, taxon);

    setHoverInfo(`${sampleId} | ${taxonomicPath} | ${percentValue.toFixed(3)}%`);
  };

  const dominantTaxon = useMemo(() => {
    const levelRows = taxonomicMockData.filter((entry) => entry.level === taxonomicLevel);
    const grouped = new Map<string, number[]>();

    for (const row of levelRows) {
      if (!grouped.has(row.taxon)) {
        grouped.set(row.taxon, []);
      }
      grouped.get(row.taxon)?.push(row.relative_frequency);
    }

    let bestTaxon = '-';
    let bestAverage = -1;

    grouped.forEach((values, taxon) => {
      const average = values.reduce((sum, value) => sum + value, 0) / values.length;
      if (average > bestAverage) {
        bestAverage = average;
        bestTaxon = taxon;
      }
    });

    return toDisplayTaxon(bestTaxon);
  }, [taxonomicLevel]);

  const shannonIndex = useMemo(() => {
    const levelRows = taxonomicMockData.filter((entry) => entry.level === taxonomicLevel);
    const sampleGroups = new Map<string, number[]>();

    for (const row of levelRows) {
      if (!sampleGroups.has(row.sample_id)) {
        sampleGroups.set(row.sample_id, []);
      }
      sampleGroups.get(row.sample_id)?.push(row.relative_frequency);
    }

    const values = Array.from(sampleGroups.values()).map((probabilities) => calculateShannonForSample(probabilities));
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;

    return mean;
  }, [taxonomicLevel]);

  const summaryCards = useMemo(
    () => [
      { label: 'Total Taxa', value: String(taxaForCurrentLevel.length) },
      { label: 'Dominant Taxon', value: dominantTaxon },
      { label: 'Shannon Diversity Index', value: shannonIndex.toFixed(3) },
      { label: 'Pathogen Flags', value: '2' },
    ],
    [dominantTaxon, shannonIndex, taxaForCurrentLevel.length]
  );

  const handleDownloadCsv = (): void => {
    const headers = ['sample_id', ...taxaForCurrentLevel];
    const csvLines = [
      headers.join(','),
      ...chartData.map((row) =>
        headers
          .map((header) => {
            const raw = row[header] ?? '';
            const value = typeof raw === 'number' ? raw.toFixed(2) : String(raw);
            return `"${value.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ];

    const csvContent = csvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.setAttribute('download', `taxonomic-level-${taxonomicLevel}.csv`);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSvg = (): void => {
    const svgElement = chartContainerRef.current?.querySelector('svg');
    if (!svgElement) {
      return;
    }

    const serializer = new XMLSerializer();
    const svgText = serializer.serializeToString(svgElement);
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.setAttribute('download', 'taxonomic-chart.svg');
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:p-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{card.label}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Taxonomic Level</span>
            <select
              value={taxonomicLevel}
              onChange={(event) => {
                const nextLevel = Number(event.target.value) as TaxonomicLevel;
                setTaxonomicLevel(nextLevel);
                setSortBy('sample_id');
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            >
              {ALL_LEVELS.map((level) => (
                <option key={level} value={level} disabled={!levelsWithData.has(level)}>
                  {`Level ${level} — ${LEVEL_RANK_LABELS[level]}${levelsWithData.has(level) ? '' : ' (no data)'}`}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Sort Samples By</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            >
              <option value="sample_id">Sample ID</option>
              {taxaForCurrentLevel.map((taxon) => (
                <option key={taxon} value={taxon}>
                  {toDisplayTaxon(taxon)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Sort Order</span>
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as SortOrder)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Color Palette</span>
            <select
              value={palette}
              onChange={(event) => setPalette(event.target.value as PaletteName)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
            >
              <option value="default">Default</option>
              <option value="colorblind-safe">Colorblind-safe</option>
              <option value="warm">Warm</option>
              <option value="cool">Cool</option>
            </select>
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex min-w-56 flex-col gap-1">
            <span className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-600">
              <span>Bar Width</span>
              <span className="text-slate-700">{barWidth}px</span>
            </span>
            <input
              type="range"
              min={10}
              max={60}
              step={1}
              value={barWidth}
              onChange={(event) => setBarWidth(Number(event.target.value))}
              className="h-10"
            />
          </label>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            Download CSV
          </button>
          <button
            type="button"
            onClick={handleDownloadSvg}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            Download SVG
          </button>
        </div>
      </div>

        <div style={{ minHeight: '28px', marginTop: '12px' }}>
        {hoverInfo ? (
          <p
            className="inline-flex font-mono text-[13px] text-slate-600 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 transition-opacity duration-150 ease-in-out"
            style={{ borderWidth: '0.5px' }}
          >
            {hoverInfo}
          </p>
        ) : null}
      </div>

      <div className="mt-6 overflow-x-auto">
        <div className="flex min-w-265 gap-4">
          <div ref={chartContainerRef} className="min-w-215 flex-1">
            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={chartData} barSize={barWidth} margin={{ top: 12, right: 20, left: 4, bottom: 90 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="sample_id"
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  height={72}
                  tick={{ fontSize: 10, fill: '#475569' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value: number | string) => `${value}%`}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  width={46}
                />
                <Tooltip
                  formatter={(value, name) => {
                    const numericValue = typeof value === 'number' ? value : Number(value ?? 0);
                    return [formatPercent(numericValue), toDisplayTaxon(String(name))];
                  }}
                  labelFormatter={(value: ReactNode) => `Sample: ${String(value)}`}
                />

                {taxaForCurrentLevel.map((taxon) => (
                  <Bar
                    key={taxon}
                    dataKey={taxon}
                    stackId="taxa"
                    fill={colorByTaxon[taxon] ?? '#64748b'}
                    onMouseEnter={(data) => {
                      handleBarMouseEnter(data, taxon);
                    }}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="w-50 shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Legend</p>
            <div className="max-h-100 space-y-2 overflow-y-auto pr-1">
              {taxaForCurrentLevel.map((taxon) => (
                <div key={taxon} className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-sm"
                    style={{ backgroundColor: colorByTaxon[taxon] ?? '#64748b' }}
                  />
                  <span className="text-xs text-slate-700">{toDisplayTaxon(taxon)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}