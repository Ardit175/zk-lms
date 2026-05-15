'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2, AlertCircle, Tag, FolderOpen } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { categoriesApi, type Category } from '@/lib/api/courses';
import { showSuccessToast, showErrorToast } from '@/lib/api';

export default function AdminSettingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const res = await categoriesApi.getAll();
      setCategories(res.data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setNameInput('');
    setDialogOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setNameInput(category.name);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!nameInput.trim()) return;
    setIsSaving(true);
    try {
      if (editing) {
        const res = await categoriesApi.update(editing.id, { name: nameInput.trim() });
        if (res.data) {
          setCategories((prev) =>
            prev.map((c) => (c.id === editing.id ? { ...c, ...res.data! } : c))
          );
          showSuccessToast('Kategoria u perditesua');
        }
      } else {
        const res = await categoriesApi.create({ name: nameInput.trim() });
        if (res.data) {
          setCategories((prev) => [...prev, res.data!].sort((a, b) => a.name.localeCompare(b.name)));
          showSuccessToast('Kategoria u krijua');
        }
      }
      setDialogOpen(false);
    } catch (err) {
      console.error('Failed to save category:', err);
      showErrorToast('Ruajtja deshtoi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Jeni te sigurt qe deshironi te fshini kategorine "${category.name}"?`)) return;
    try {
      await categoriesApi.remove(category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      showSuccessToast('Kategoria u fshi');
    } catch (err) {
      console.error('Failed to delete category:', err);
      showErrorToast('Fshirja deshtoi');
    }
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cilesimet</h1>
          <p className="text-slate-500 mt-1">Konfiguro kategorite dhe parametrat e platformes</p>
        </div>

        {/* Categories management */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-slate-400" />
              Kategorite e Kurseve
            </CardTitle>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Kategori e Re
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
                <p className="text-slate-600">Ngarkimi i kategorive deshtoi</p>
                <Button className="mt-3" size="sm" onClick={loadCategories}>
                  Provo Perseri
                </Button>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-10">
                <FolderOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="font-medium text-slate-900">Asnje kategori</p>
                <p className="text-sm text-slate-500 mt-1">
                  Shtoni kategorine e pare per te organizuar kurset.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{category.name}</p>
                      <p className="text-sm text-slate-500">
                        {category._count?.courses ?? 0} kurse
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(category)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System info (read-only) */}
        <Card>
          <CardHeader>
            <CardTitle>Informacione te Sistemit</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between rounded-lg bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Limiti i skedareve video</dt>
                <dd className="font-medium text-slate-900">50 MB</dd>
              </div>
              <div className="flex justify-between rounded-lg bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Limiti i skedareve PDF</dt>
                <dd className="font-medium text-slate-900">10 MB</dd>
              </div>
              <div className="flex justify-between rounded-lg bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Pikezimi kalues i kuizit</dt>
                <dd className="font-medium text-slate-900">70%</dd>
              </div>
              <div className="flex justify-between rounded-lg bg-slate-50 px-4 py-3">
                <dt className="text-slate-500">Gjuha e platformes</dt>
                <dd className="font-medium text-slate-900">Shqip</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Category dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Redakto Kategorine' : 'Kategori e Re'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Ndrysho emrin e kesaj kategorie.'
                : 'Shto nje kategori te re per kurset.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="category-name">Emri</Label>
            <Input
              id="category-name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="p.sh. Programim Web"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Anulo
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !nameInput.trim()}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Ruaj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
