'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { sq } from 'date-fns/locale';
import {
  Award,
  Download,
  Share2,
  Loader2,
  ExternalLink,
  CheckCircle,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { certificatesApi, type Certificate } from '@/lib/api/certificates';
import { resolveFileUrl } from '@/lib/fileUrl';
import { useAuthStore } from '@/stores/auth-store';

export default function StudentCertificatesPage() {
  const { token } = useAuthStore();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shareDialog, setShareDialog] = useState<Certificate | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    setIsLoading(true);
    try {
      const res = await certificatesApi.getMyCertificates();
      if (res.data) setCertificates(res.data);
    } catch (error) {
      console.error('Failed to load certificates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (certificate: Certificate) => {
    const url = resolveFileUrl(`/api/certificates/${certificate.id}/download`);

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `certificate-${certificate.certificateNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleCopyLink = () => {
    if (!shareDialog) return;
    const url = `${window.location.origin}/verify/${shareDialog.verificationCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getVerificationUrl = (verificationCode: string) => {
    return `${window.location.origin}/verify/${verificationCode}`;
  };

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Certifikatat e Mia</h1>
          <p className="text-slate-500 mt-1">
            Shkarkoni dhe ndani certifikatat tuaja
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : certificates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Award className="h-12 w-12 mb-4 text-slate-300" />
              <p className="text-lg font-medium">Asnje certifikate ende</p>
              <p className="text-sm mt-1">
                Perfundoni nje kurs per te marre certifikaten tuaj te pare
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((certificate) => (
              <Card key={certificate.id} className="overflow-hidden">
                <div className="aspect-video relative bg-gradient-to-br from-indigo-500 to-purple-600">
                  {certificate.course.thumbnailUrl ? (
                    <Image
                      src={certificate.course.thumbnailUrl}
                      alt={certificate.course.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover opacity-30"
                    />
                  ) : null}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Award className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm font-medium opacity-80">Certifikate</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-slate-900 line-clamp-2 mb-2">
                    {certificate.course.title}
                  </h3>
                  <p className="text-sm text-slate-500 mb-1">
                    Instruktor: {certificate.course.instructorName}
                  </p>
                  <p className="text-sm text-slate-500 mb-4">
                    Leshuar me{' '}
                    {format(new Date(certificate.issuedAt), 'dd MMMM yyyy', { locale: sq })}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(certificate)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Shkarko PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShareDialog(certificate)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Share Dialog */}
      <Dialog open={!!shareDialog} onOpenChange={() => setShareDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ndaj Certifikaten</DialogTitle>
            <DialogDescription>
              Kopjoni linkun e verifikimit per te ndarë certifikaten tuaj
            </DialogDescription>
          </DialogHeader>
          {shareDialog && (
            <div className="space-y-4 py-4">
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={getVerificationUrl(shareDialog.verificationCode)}
                  className="flex-1"
                />
                <Button onClick={handleCopyLink} variant="outline">
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-slate-500">
                Kushdo me kete link mund te verifikoje autenticitetin e certifikates suaj.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  window.open(getVerificationUrl(shareDialog.verificationCode), '_blank');
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Hap ne dritare te re
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
