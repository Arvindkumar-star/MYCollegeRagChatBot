import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function DeleteConfirmModal({ title = 'Delete conversation?', onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm" onClick={onCancel}>
      <div className="delete-confirm-modal w-full max-w-sm animate-scale-in" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
        <button onClick={onCancel} className="delete-modal-close" aria-label="Close delete confirmation"><X size={16} /></button>
        <div className="delete-modal-icon"><AlertTriangle size={22} /></div>
        <h2 id="delete-dialog-title" className="text-lg font-bold text-white text-center mt-4">{title}</h2>
        <p className="text-sm text-white/50 text-center leading-relaxed mt-2">
          This will permanently remove the conversation and all its messages. This action cannot be undone.
        </p>
        <div className="flex gap-2 mt-6">
          <button onClick={onCancel} className="delete-modal-cancel flex-1">Keep conversation</button>
          <button onClick={onConfirm} className="delete-modal-confirm flex-1"><Trash2 size={14} /> Delete</button>
        </div>
      </div>
    </div>
  );
}