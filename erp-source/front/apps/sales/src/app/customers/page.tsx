import { Plus, Building2, Mail, Phone } from "lucide-react";

const customers = [
  { id: "CUST-001", name: "Acme Corp", contact: "John Williams", email: "john@acme.com", phone: "+1 555-0101", city: "New York", orders: 24, revenue: "$245,000", status: "active" },
  { id: "CUST-002", name: "TechStart Inc", contact: "Sarah Chen", email: "sarah@techstart.io", phone: "+1 555-0102", city: "San Francisco", orders: 15, revenue: "$128,500", status: "active" },
  { id: "CUST-003", name: "Global Industries", contact: "Mike Johnson", email: "mike@globalind.com", phone: "+1 555-0103", city: "Chicago", orders: 42, revenue: "$890,000", status: "active" },
  { id: "CUST-004", name: "Smith & Partners", contact: "Emma Smith", email: "emma@smithp.com", phone: "+1 555-0104", city: "Boston", orders: 8, revenue: "$67,200", status: "active" },
  { id: "CUST-005", name: "NextGen Solutions", contact: "David Park", email: "david@nextgen.co", phone: "+1 555-0105", city: "Seattle", orders: 31, revenue: "$412,000", status: "active" },
  { id: "CUST-006", name: "Pinnacle LLC", contact: "Lisa Brown", email: "lisa@pinnacle.com", phone: "+1 555-0106", city: "Austin", orders: 3, revenue: "$18,600", status: "inactive" },
];

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">{customers.length} registered customers</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{c.name}</h3>
                  <p className="text-xs text-gray-500">{c.id}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>{c.status}</span>
            </div>
            <div className="space-y-1.5 mb-4">
              <p className="text-sm text-gray-700">{c.contact}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500"><Mail className="w-3 h-3" />{c.email}</div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500"><Phone className="w-3 h-3" />{c.phone}</div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="text-center"><p className="text-sm font-semibold text-gray-900">{c.orders}</p><p className="text-xs text-gray-500">Orders</p></div>
              <div className="text-center"><p className="text-sm font-semibold text-gray-900">{c.revenue}</p><p className="text-xs text-gray-500">Revenue</p></div>
              <div className="text-center"><p className="text-sm font-semibold text-gray-900">{c.city}</p><p className="text-xs text-gray-500">Location</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
