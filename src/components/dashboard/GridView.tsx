interface GridViewProps {
  compact?: boolean;
}

export default function GridView({ compact = false }: GridViewProps) {
  return (
    <div className={`rounded-lg border border-dashed border-slate-300 bg-slate-50 ${compact ? 'p-3' : 'p-5'}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Grid View</p>
      <p className="mt-1 text-sm text-slate-500">
        Placeholder module ready for future card/list dataset rendering.
      </p>
    </div>
  );
}
