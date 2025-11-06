import { motion } from 'framer-motion';

interface ConfirmationDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({ message, onConfirm, onCancel }: ConfirmationDialogProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-auto"
      >
        <p className="text-center text-gray-800 mb-6">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition-colors"
          >
            Yes
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            No
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default ConfirmationDialog;
