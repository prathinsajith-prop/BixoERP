import { Upload, Folder, FileText, FileSpreadsheet, FileImage, File } from "lucide-react";

const folders = [
  { name: "Finance", files: 142, size: "2.8 GB" },
  { name: "Procurement", files: 89, size: "1.2 GB" },
  { name: "HR", files: 234, size: "856 MB" },
  { name: "Projects", files: 67, size: "3.4 GB" },
  { name: "Contracts", files: 45, size: "420 MB" },
];

const recentFiles = [
  { name: "Q1-2024-Income-Statement.pdf", folder: "Finance", type: "pdf", size: "245 KB", uploaded: "2024-03-15", by: "Sarah Chen" },
  { name: "PO-2024-0161-Quotation.pdf", folder: "Procurement", type: "pdf", size: "128 KB", uploaded: "2024-03-15", by: "Tom Green" },
  { name: "Employee-Directory.xlsx", folder: "HR", type: "xlsx", size: "1.2 MB", uploaded: "2024-03-14", by: "Lisa Kim" },
  { name: "Warehouse-Layout-v3.png", folder: "Projects", type: "image", size: "3.8 MB", uploaded: "2024-03-14", by: "Mike Ross" },
  { name: "Vendor-Agreement-TechComp.docx", folder: "Contracts", type: "doc", size: "89 KB", uploaded: "2024-03-13", by: "James Lee" },
  { name: "March-Payroll-Summary.xlsx", folder: "Finance", type: "xlsx", size: "456 KB", uploaded: "2024-03-13", by: "Anna Park" },
];

function FileIcon({ type }: { type: string }) {
  switch (type) {
    case "pdf": return <FileText className="w-5 h-5 text-red-500" />;
    case "xlsx": return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    case "image": return <FileImage className="w-5 h-5 text-purple-500" />;
    case "doc": return <FileText className="w-5 h-5 text-blue-500" />;
    default: return <File className="w-5 h-5 text-gray-400" />;
  }
}

export default function FilesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Manage files & attachments across all modules</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Upload className="w-4 h-4" /> Upload
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {folders.map((f) => (
          <div key={f.name} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:border-blue-300 cursor-pointer text-center space-y-2">
            <Folder className="w-8 h-8 text-yellow-500 mx-auto" />
            <p className="text-sm font-medium text-gray-900">{f.name}</p>
            <p className="text-xs text-gray-500">{f.files} files · {f.size}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Files</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {recentFiles.map((f) => (
            <div key={f.name} className="px-6 py-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer">
              <FileIcon type={f.type} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                <p className="text-xs text-gray-500">{f.folder} · {f.size}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-500">{f.uploaded}</p>
                <p className="text-xs text-gray-400">by {f.by}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
