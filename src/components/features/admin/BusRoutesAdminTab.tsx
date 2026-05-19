import type { ElementType } from "react";
import { RefreshCw, Database, Bus, MapPin, Clock, Calendar } from "lucide-react";
import { useGtfsStats } from "@/hooks/use-gtfs";

function StatCard({ icon: Icon, label, value, color }: {
  icon: ElementType;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/60 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-bold text-foreground">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

export function BusRoutesAdminTab() {
  const { data: stats, isLoading, refetch, isFetching } = useGtfsStats();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">GTFS Transit Data</h2>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/30 px-3 py-1.5 text-sm font-semibold text-muted-foreground disabled:opacity-50"
        >
          <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Info banner */}
      <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/20 px-4 py-3">
        <p className="text-sm text-blue-800 dark:text-blue-300 font-semibold mb-1">
          Powered by OSY GTFS data
        </p>
        <p className="text-xs text-blue-700 dark:text-blue-400">
          Bus data is managed via the GTFS import script, not manually.
          To update, run <code className="font-mono bg-blue-100 dark:bg-blue-800/40 rounded px-1">scripts/import-gtfs.ts</code> after downloading a new GTFS zip from OSY.
        </p>
      </div>

      {/* Stats grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Bus}      label="Routes"         value={stats.routes}         color="bg-blue-500" />
          <StatCard icon={MapPin}   label="Stops"          value={stats.stops}          color="bg-emerald-500" />
          <StatCard icon={Bus}      label="Trips"          value={stats.trips}          color="bg-violet-500" />
          <StatCard icon={Clock}    label="Stop Times"     value={stats.stop_times}     color="bg-amber-500" />
          <StatCard icon={Database} label="Shape Points"   value={stats.shape_points}   color="bg-sky-500" />
          <StatCard icon={Calendar} label="Service Dates"  value={stats.calendar_dates} color="bg-rose-500" />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border py-10 text-center">
          <Database size={32} className="mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No GTFS data found</p>
          <p className="text-xs text-muted-foreground mt-1">Run the import script to populate data</p>
        </div>
      )}

      {/* Import instructions */}
      <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2">
        <p className="text-xs font-semibold text-foreground">How to re-import GTFS data</p>
        <ol className="space-y-1.5 text-xs text-muted-foreground list-decimal list-inside">
          <li>Download new GTFS zip from OSY (saves to Downloads)</li>
          <li>Open a PowerShell terminal in the project directory</li>
          <li>Set env vars: <code className="font-mono text-foreground">$env:VITE_SUPABASE_URL</code> and <code className="font-mono text-foreground">$env:SUPABASE_SERVICE_ROLE_KEY</code></li>
          <li>Run: <code className="font-mono text-foreground">npx tsx scripts/import-gtfs.ts</code></li>
          <li>Import takes ~2–5 min — check console for progress</li>
        </ol>
      </div>
    </div>
  );
}
