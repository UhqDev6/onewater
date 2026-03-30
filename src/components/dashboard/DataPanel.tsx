'use client';

import { useMemo, useState } from 'react';
import { NormalizedWaterQualityData } from '@/lib/types';
import { formatDate, getQualityLabel } from '@/lib/utils/dataHelpers';
import GridView from './GridView';
import ChartPanel from './ChartPanel';
import GenomicsPanel from './GenomicsPanel';

type PanelTab = 'overview' | 'water' | 'trends' | 'genomics';

interface DataPanelProps {
  selectedData?: NormalizedWaterQualityData;
  totalLocations: number;
}

const panelTabs: { key: PanelTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'water', label: 'Water Data' },
  { key: 'trends', label: 'Trends' },
  { key: 'genomics', label: 'Genomics' },
];

export default function DataPanel({ selectedData, totalLocations }: DataPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('overview');

  const selectedLocationSummary = useMemo(() => {
    if (!selectedData) {
      return {
        name: 'No location selected',
        subtitle: 'Select a marker on the map to inspect monitoring details.',
      };
    }

    return {
      name: selectedData.location.name,
      subtitle: `${selectedData.location.region || 'Unknown region'}, ${selectedData.location.state}`,
    };
  }, [selectedData]);

  return (
    <div className="flex h-full max-h-[78vh] flex-col">
      <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Environmental Data Panel</p>
        <h3 className="mt-1 text-lg font-semibold text-slate-900">{selectedLocationSummary.name}</h3>
        <p className="text-sm text-slate-600">{selectedLocationSummary.subtitle}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700">
            Scope: {totalLocations} locations
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700">
            Status: {selectedData ? 'Location selected' : 'Awaiting map selection'}
          </span>
        </div>
      </div>

      <div className="border-b border-slate-200 px-2 py-2">
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4" role="tablist" aria-label="Data panel tabs">
          {panelTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                role="tab"
                aria-selected={isActive}
                className={`rounded-md border px-2 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                  isActive
                    ? 'border-slate-800 bg-slate-800 text-white'
                    : 'border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {activeTab === 'overview' && (
          <>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Current Status</p>
              <p className="mt-2 text-sm text-slate-700">
                {selectedData
                  ? `Quality: ${getQualityLabel(selectedData.latestReading.qualityRating)}`
                  : 'Waiting for map interaction.'}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {selectedData
                  ? `Last observation: ${formatDate(
                      selectedData.latestReading.latestResultObservationDate || selectedData.latestReading.sampleDate
                    )}`
                  : 'Choose a location marker to populate this panel.'}
              </p>
            </div>

            <GridView compact />
          </>
        )}

        {activeTab === 'water' && (
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Water Data</p>
            {selectedData ? (
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Quality Rating</dt>
                  <dd className="font-medium text-slate-900">{getQualityLabel(selectedData.latestReading.qualityRating)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Pollution Forecast</dt>
                  <dd className="font-medium text-slate-900">{selectedData.latestReading.pollutionForecast || 'N/A'}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Forecast Timestamp</dt>
                  <dd className="font-medium text-slate-900">
                    {selectedData.latestReading.pollutionForecastTimeStamp
                      ? formatDate(selectedData.latestReading.pollutionForecastTimeStamp)
                      : 'N/A'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Observation Date</dt>
                  <dd className="font-medium text-slate-900">
                    {formatDate(
                      selectedData.latestReading.latestResultObservationDate || selectedData.latestReading.sampleDate
                    )}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-2 text-sm text-slate-600">Select a location on the map to view water quality details.</p>
            )}
          </div>
        )}

        {activeTab === 'trends' && <ChartPanel />}

        {activeTab === 'genomics' && <GenomicsPanel />}
      </div>
    </div>
  );
}
