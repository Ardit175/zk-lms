'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { sq } from 'date-fns/locale';
import {
  CheckCircle,
  XCircle,
  Award,
  Loader2,
  User,
  BookOpen,
  Calendar,
  Hash,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { certificatesApi, type CertificateVerification } from '@/lib/api/certificates';

export default function VerifyCertificatePage() {
  const params = useParams();
  const code = params.code as string;

  const [result, setResult] = useState<CertificateVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    verifyCertificate();
  }, [code]);

  const verifyCertificate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await certificatesApi.verify(code);
      if (res.data) {
        setResult(res.data);
      }
    } catch (err) {
      setError('Certifikata nuk u gjet ose kodi eshte i pavlefshem');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">
            Z
          </div>
          <span className="text-2xl font-semibold text-foreground">EduAI</span>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-12 flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Duke verifikuar certifikaten...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-destructive/30 bg-destructive/10">
            <CardContent className="py-12 flex flex-col items-center justify-center">
              <XCircle className="h-16 w-16 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-destructive mb-2">
                Verifikimi Deshtoi
              </h2>
              <p className="text-destructive text-center">{error}</p>
            </CardContent>
          </Card>
        ) : result ? (
          <Card className="border-success/30">
            <CardContent className="py-8">
              {/* Success Header */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="p-3 bg-success/15 rounded-full">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-success">
                    Certifikate e Vlefshme
                  </h2>
                  <p className="text-success text-sm">Verifikuar me sukses</p>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                <div className="text-center mb-6">
                  <Award className="h-12 w-12 text-primary mx-auto mb-3" />
                  <h3 className="text-2xl font-bold text-foreground">
                    {result.studentName}
                  </h3>
                  <p className="text-muted-foreground">ka perfunduar me sukses kursin</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-card rounded-lg">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Kursi</p>
                      <p className="font-medium text-foreground">{result.courseName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-card rounded-lg">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Instruktor</p>
                      <p className="font-medium text-foreground">{result.instructorName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-card rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Data e Leshimit</p>
                      <p className="font-medium text-foreground">
                        {format(new Date(result.issuedAt), 'dd MMMM yyyy', { locale: sq })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-card rounded-lg">
                    <Hash className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Numri i Certifikates</p>
                      <p className="font-mono text-sm text-foreground">
                        {result.certificateNumber}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Ky verifikim u krye nga platforma EduAI
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
