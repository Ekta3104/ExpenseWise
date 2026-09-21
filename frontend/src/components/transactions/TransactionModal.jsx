import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { toInputDateFormat } from '../../utils/formatters';
import { Plus, Tag, Loader2 } from 'lucide-react';
import { categoryService } from '../../services/categoryService';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Credit Card',
  'Debit Card',
  'Net Banking',
  'Other'
];

const TransactionModal = ({
  isOpen,
  onClose,
  onSubmit,
  transactionToEdit = null
}) => {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(toInputDateFormat(new Date()));
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  // Categories list
  const [categories, setCategories] = useState([]);
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  // Loading and errors
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch categories on mount or open
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await categoryService.getCategories();
        if (res.success && res.data) {
          setCategories(res.data);
          // Set default category if none set
          if (!category && res.data.length > 0) {
            const firstMatching =
              res.data.find((c) => c.type === type || c.type === 'both') || res.data[0];
            setCategory(firstMatching.name);
          }
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };

    if (isOpen) {
      loadCategories();
    }
  }, [isOpen, type]);

  // Fill form if editing
  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type || 'expense');
      setAmount(transactionToEdit.amount?.toString() || '');
      setCategory(transactionToEdit.category || '');
      setDate(toInputDateFormat(transactionToEdit.date));
      setDescription(transactionToEdit.description || '');
      setPaymentMethod(transactionToEdit.paymentMethod || 'Cash');
    } else {
      // Reset form
      setType('expense');
      setAmount('');
      setDate(toInputDateFormat(new Date()));
      setDescription('');
      setPaymentMethod('UPI');
    }
    setErrors({});
    setIsAddingCustomCategory(false);
    setCustomCategoryName('');
  }, [transactionToEdit, isOpen]);

  // Handle quick custom category creation
  const handleCreateCustomCategory = async (e) => {
    e.preventDefault();
    if (!customCategoryName.trim()) {
      toast.error('Category name cannot be empty');
      return;
    }
    try {
      const res = await categoryService.createCategory({
        name: customCategoryName.trim(),
        type
      });
      if (res.success) {
        toast.success(`Category "${res.data.name}" created`);
        setCategories((prev) => [...prev, res.data]);
        setCategory(res.data.name);
        setIsAddingCustomCategory(false);
        setCustomCategoryName('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    }
  };

  const validate = () => {
    const errs = {};
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      errs.amount = 'Amount must be a positive number greater than 0';
    }
    if (!category || category.trim() === '') {
      errs.category = 'Please choose or create a category';
    }
    if (!date) {
      errs.date = 'Valid date is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit({
        type,
        amount: parseFloat(amount),
        category,
        date: new Date(date),
        description,
        paymentMethod
      });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(
    (c) => c.type === type || c.type === 'both'
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transactionToEdit ? 'Edit Transaction' : 'Record Transaction'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Income / Expense Type Toggle */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setType('expense');
              // auto switch category to first expense cat
              const cat = categories.find((c) => c.type === 'expense' || c.type === 'both');
              if (cat) setCategory(cat.name);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              type === 'expense'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Expense (-)
          </button>
          <button
            type="button"
            onClick={() => {
              setType('income');
              // auto switch category to first income cat
              const cat = categories.find((c) => c.type === 'income' || c.type === 'both');
              if (cat) setCategory(cat.name);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              type === 'income'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Income (+)
          </button>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Amount (INR) *
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
              ₹
            </span>
            <input
              type="number"
              step="any"
              min="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (errors.amount) setErrors((prev) => ({ ...prev, amount: null }));
              }}
              placeholder="0.00"
              className={`w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${
                errors.amount
                  ? 'border-rose-500 focus:ring-rose-500'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500'
              } rounded-xl text-slate-900 dark:text-white font-bold text-lg focus:outline-none focus:ring-2`}
              autoFocus
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-xs text-rose-500 font-medium">{errors.amount}</p>
          )}
        </div>

        {/* Category Selector with Custom Creation Option */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Category *
            </label>
            <button
              type="button"
              onClick={() => setIsAddingCustomCategory(!isAddingCustomCategory)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              {isAddingCustomCategory ? 'Cancel Custom' : 'Custom Category'}
            </button>
          </div>

          {isAddingCustomCategory ? (
            <div className="flex items-center gap-2 p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800">
              <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <input
                type="text"
                placeholder="New Category Name (e.g. Gym, Books)"
                value={customCategoryName}
                onChange={(e) => setCustomCategoryName(e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleCreateCustomCategory}
                className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shrink-0"
              >
                Add
              </button>
            </div>
          ) : (
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                if (errors.category) setErrors((prev) => ({ ...prev, category: null }));
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {filteredCategories.map((c) => (
                <option key={c._id || c.name} value={c.name}>
                  {c.name} {c.isCustom ? '(Custom)' : ''}
                </option>
              ))}
            </select>
          )}
          {errors.category && (
            <p className="mt-1 text-xs text-rose-500 font-medium">{errors.category}</p>
          )}
        </div>

        {/* Date and Payment Method Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.date && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{errors.date}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Note / Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Description / Note (Optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Dinner with team at restaurant"
            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Submit Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-md shadow-indigo-500/20 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {transactionToEdit ? 'Update Transaction' : 'Save Transaction'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TransactionModal;
