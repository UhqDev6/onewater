import { ReactNode } from 'react';

interface MonitoringLayoutProps {
  mapContent: ReactNode;
  leftPanel?: ReactNode;
  rightPanel?: ReactNode;
  topOverlay?: ReactNode;
  bottomOverlay?: ReactNode;
  mapHeightClass?: string;
}

export default function MonitoringLayout({
  mapContent,
  leftPanel,
  rightPanel,
  topOverlay,
  bottomOverlay,
  mapHeightClass = 'h-[72vh] lg:h-[82vh]',
}: MonitoringLayoutProps) {
  return (
    <section className="space-y-4" data-monitoring-shell>
      <div className="relative rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className={`relative overflow-hidden rounded-lg border border-slate-100 bg-slate-50 ${mapHeightClass}`}>
          <div className="absolute inset-0">{mapContent}</div>

          {topOverlay && (
            <div className="pointer-events-none absolute inset-x-3 top-3 z-30 lg:inset-x-6 lg:top-5">
              <div className="pointer-events-none">{topOverlay}</div>
            </div>
          )}

          {leftPanel && (
            <aside className="pointer-events-none absolute left-3 top-4 z-30 hidden max-h-[calc(100%-3rem)] w-80 lg:block">
              <div className="pointer-events-auto h-full overflow-y-auto rounded-xl border border-slate-200/90 bg-white/95 p-3 shadow-xl backdrop-blur-sm">
                {leftPanel}
              </div>
            </aside>
          )}

          {rightPanel && (
            <aside className="pointer-events-none absolute right-3 top-4 z-30 hidden max-h-[calc(100%-3rem)] w-90 lg:block">
              <div className="pointer-events-auto h-full overflow-y-auto rounded-xl border border-slate-200/90 bg-white/95 p-3 shadow-xl backdrop-blur-sm">
                {rightPanel}
              </div>
            </aside>
          )}

          {bottomOverlay && (
            <div className="pointer-events-none absolute inset-x-3 bottom-3 z-30 hidden lg:block">
              <div className="pointer-events-auto">{bottomOverlay}</div>
            </div>
          )}
        </div>
      </div>

      {(leftPanel || rightPanel || bottomOverlay) && (
        <div className="space-y-3 lg:hidden">
          {leftPanel && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              {leftPanel}
            </div>
          )}
          {rightPanel && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              {rightPanel}
            </div>
          )}
          {bottomOverlay && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              {bottomOverlay}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
