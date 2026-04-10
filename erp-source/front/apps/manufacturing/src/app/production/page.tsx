import { PageHeader, StatusBadge } from "@erp/ui";

const productionLines = [
  { id: "LINE-01", name: "Assembly Line A", product: "Widget Assembly A", shift: "Day", capacity: 120, output: 105, efficiency: 87.5, status: "running" },
  { id: "LINE-02", name: "SMT Line B", product: "Circuit Board X12", shift: "Day", capacity: 80, output: 76, efficiency: 95.0, status: "running" },
  { id: "LINE-03", name: "CNC Line C", product: "Housing Unit B", shift: "Night", capacity: 60, output: 0, efficiency: 0, status: "idle" },
  { id: "LINE-04", name: "Assembly Line D", product: "Gear Assembly C", shift: "Day", capacity: 100, output: 92, efficiency: 92.0, status: "running" },
];

export default function ProductionPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Production Lines" description="Real-time production monitoring" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {productionLines.map((line) => (
          <div key={line.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{line.name}</h3>
                <p className="text-sm text-gray-500">{line.product} · {line.shift} Shift</p>
              </div>
              <StatusBadge status={line.status} />
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Capacity</p>
                <p className="text-lg font-bold text-gray-900">{line.capacity}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Output</p>
                <p className="text-lg font-bold text-gray-900">{line.output}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Efficiency</p>
                <p className="text-lg font-bold text-gray-900">{line.efficiency}%</p>
              </div>
            </div>

            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${line.efficiency >= 90 ? "bg-green-500" : line.efficiency >= 70 ? "bg-yellow-500" : "bg-gray-300"}`} style={{ width: `${line.efficiency}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
