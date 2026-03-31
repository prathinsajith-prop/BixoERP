import { Building2 } from "lucide-react";

const warehouses = [
  { id: "WH-MAIN", name: "Main Warehouse", location: "Building A, Floor 1", skus: 892, value: "$845,200", manager: "Tom Harris" },
  { id: "WH-WEST", name: "West Distribution Center", location: "2100 West Industrial Blvd", skus: 245, value: "$312,400", manager: "Jessica Lee" },
  { id: "WH-EAST", name: "East Storage Facility", location: "500 East Commerce Dr", skus: 110, value: "$88,080", manager: "Carlos Mendez" },
];

export default function WarehousesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
        <p className="text-sm text-gray-500 mt-1">{warehouses.length} locations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {warehouses.map((w) => (
          <div key={w.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{w.name}</h3>
                <p className="text-xs text-gray-500">{w.location}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
              <div>
                <p className="text-lg font-bold text-gray-900">{w.skus}</p>
                <p className="text-xs text-gray-500">SKUs</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{w.value}</p>
                <p className="text-xs text-gray-500">Value</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">Manager: {w.manager}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
