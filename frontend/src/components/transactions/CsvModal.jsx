import React, { useState } from 'react';
import Modal from '../common/Modal';
import { Download, Upload, FileSpreadsheet, Loader2, CheckCircle } from 'lucide-react';
import { transactionService } from '../../services/transactionService';
import toast from 'react-hot-toast';

const CsvModal = ({ isOpen, onClose, onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await transactionService.exportCSV();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ExpenseWise_Transactions_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Transactions exported to CSV successfully');
    } catch (err) {
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a CSV file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const res = await transactionService.importCSV(formData);
      if (res.success) {
        toast.success(res.message || 'Transactions imported successfully');
        setFile(null);
        if (onImportSuccess) onImportSuccess();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'CSV Import failed. Check format.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="CSV Import & Export" maxWidth="max-w-md">
      <div className="space-y-6">
        {/* Export Section */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Export Transactions
              </h4>
              <p className="text-xs text-slate-400">
                Download all your transactions as a CSV spreadsheet.
              </p>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 hover:bg-emerald-200 dark:bg-emerald-900/40 rounded-xl transition-colors disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Download CSV Backup
          </button>
        </div>

        {/* Import Section */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Import from CSV
              </h4>
              <p className="text-xs text-slate-400">
                Upload a CSV with columns: Type, Amount, Category, Date, Payment Method, Description.
              </p>
            </div>
          </div>

          <form onSubmit={handleImport} className="mt-3 space-y-3">
            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl cursor-pointer bg-white dark:bg-slate-900 transition-colors">
              <FileSpreadsheet className="w-7 h-7 text-indigo-500 mb-1" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                {file ? file.name : 'Select CSV file'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">Click to browse (.csv only)</span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </label>

            <button
              type="submit"
              disabled={!file || isUploading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Import Transactions
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default CsvModal;
