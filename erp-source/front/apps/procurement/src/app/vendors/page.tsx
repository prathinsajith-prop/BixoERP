import { Plus, Building2, Star } from "lucide-react";

const vendors = [
  { id: "V-001", name: "Raw Materials Ltd", contact: "James Wilson", email: "james@rawmaterials.com", phone: "+1 555-0201", category: "Raw Materials", rating: 4.5, orders: 156, spend: "$1,245,000", status: "active" },
  { id: "V-002", name: "Office Supply Co", contact: "Karen White", email: "karen@officesupply.com", phone: "+1 555-0202", category: "Office", rating: 4.2, orders: 89, spend: "$45,600", status: "active" },
  { id: "V-003", name: "Equipment Leasing", contact: "Tom Davis", email: "tom@equipleasing.com", phone: "+1 555-0203", category: "Equipment", rating: 4.0, orders: 12, spend: "$380,000", status: "active" },
  { id: "V-004", name: "Tech Components Inc", contact: "Anna Lee", email: "anna@techcomp.com", phone: "+1 555-0204", category: "Electronics", rating: 4.8, orders: 234, spend: "$892,000", status: "active" },
  { id: "V-005", name: "Packaging Solutions", contact: "Ryan Scott", email: "ryan@packaging.co", phone: "+1 555-0205", category: "Packaging", rating: 3.8, orders: 67, spend: "$128,400", status: "active" },
  { id: "V-006", name: "Metal Works Co", contact: "Chris Brown", email: "chris@metalworks.com", phone: "+1 555-0206", category: "Raw Materials", rating: 4.3, orders: 98, spend: "$567,000", status: "inactive" },
];

export default function VendorsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-sm text-gray-500 mt-1">{vendors.length} registered vendors</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Rating</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Spend</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vendors.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{v.name}</p>
                      <p className="text-xs text-gray-500">{v.contact} · {v.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{v.category}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium text-gray-900">{v.rating}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-700">{v.orders}</td>
                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{v.spend}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${v.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>{v.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
