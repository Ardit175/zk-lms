'use client';

import { useState, useEffect } from 'react';
import { Loader2, ClipboardList, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { assignmentsApi, type Assignment, type SubmissionType } from '@/lib/api/assignments';
import { showErrorToast, showSuccessToast } from '@/lib/api';

interface AssignmentEditorProps {
  lessonId: string;
  lessonTitle: string;
  isOpen: boolean;
  onClose: () => void;
  /** notifies the builder so it can refresh its lesson state */
  onSaved?: (assignment: Assignment | null) => void;
}

const SUBMISSION_LABELS: Record<SubmissionType, string> = {
  TEXT: 'Tekst',
  FILE: 'Skedar',
  LINK: 'Link',
};

// Converts an ISO date to the value a <input type="datetime-local"> expects.
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function AssignmentEditor({ lessonId, lessonTitle, isOpen, onClose, onSaved }: AssignmentEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [existing, setExisting] = useState<Assignment | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxScore, setMaxScore] = useState(100);
  const [submissionType, setSubmissionType] = useState<SubmissionType>('TEXT');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    assignmentsApi
      .getForEdit(lessonId)
      .then((res) => {
        const a = res.data ?? null;
        setExisting(a);
        if (a) {
          setTitle(a.title);
          setDescription(a.description);
          setInstructions(a.instructions);
          setDueDate(toLocalInput(a.dueDate));
          setMaxScore(a.maxScore);
          setSubmissionType(a.submissionType);
        } else {
          setTitle(lessonTitle ? `Detyre: ${lessonTitle}` : '');
          setDescription('');
          setInstructions('');
          setDueDate('');
          setMaxScore(100);
          setSubmissionType('TEXT');
        }
      })
      .catch((err) => {
        console.error('Failed to load assignment:', err);
        showErrorToast('Deshtoi te ngarkonte detyren');
      })
      .finally(() => setLoading(false));
  }, [isOpen, lessonId, lessonTitle]);

  const handleSave = async () => {
    if (title.trim().length < 3) return showErrorToast('Titulli duhet te kete te pakten 3 karaktere');
    if (description.trim().length < 1) return showErrorToast('Shtoni nje pershkrim');
    if (instructions.trim().length < 1) return showErrorToast('Shtoni udhezimet');

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        maxScore,
        submissionType,
      };
      const res = existing
        ? await assignmentsApi.updateAssignment(existing.id, payload)
        : await assignmentsApi.createAssignment({ lessonId, ...payload });
      if (res.data) {
        showSuccessToast(existing ? 'Detyra u perditesua' : 'Detyra u krijua');
        onSaved?.(res.data);
        onClose();
      }
    } catch (err) {
      console.error('Failed to save assignment:', err);
      showErrorToast('Ruajtja e detyres deshtoi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existing) return;
    if (!window.confirm('Je i sigurt qe do ta fshish kete detyre? Te gjitha dorezimet do te humbasin.')) return;
    setDeleting(true);
    try {
      await assignmentsApi.deleteAssignment(existing.id);
      showSuccessToast('Detyra u fshi');
      onSaved?.(null);
      onClose();
    } catch (err) {
      console.error('Failed to delete assignment:', err);
      showErrorToast('Fshirja deshtoi');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            {existing ? 'Edito Detyren' : 'Krijo Detyre'}
          </DialogTitle>
          <DialogDescription>Konfiguro detyren per kete mesim.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="a-title">Titulli</Label>
              <Input id="a-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titulli i detyres" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="a-desc">Pershkrimi i shkurter</Label>
              <Input id="a-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Nje permbledhje e shkurter" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="a-instr">Udhezimet</Label>
              <textarea
                id="a-instr"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Udhezimet e plota per studentet..."
                className="h-32 w-full resize-none rounded-lg border border-input bg-card p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="a-due">Afati (opsional)</Label>
                <Input id="a-due" type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-score">Pike maksimale</Label>
                <Input
                  id="a-score"
                  type="number"
                  min={1}
                  max={1000}
                  value={maxScore}
                  onChange={(e) => setMaxScore(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
              <div className="space-y-2">
                <Label>Lloji i dorezimit</Label>
                <Select value={submissionType} onValueChange={(v) => setSubmissionType(v as SubmissionType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SUBMISSION_LABELS) as SubmissionType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {SUBMISSION_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              {existing ? (
                <Button variant="ghost" onClick={handleDelete} disabled={deleting} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                  {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Fshi
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Anulo
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Ruaj
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
