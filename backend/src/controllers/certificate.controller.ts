import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { pdfService } from '../services/pdf.service';
import { ApiResponse } from '../utils/ApiResponse';

export const verifyCertificate = async (req: Request, res: Response): Promise<void> => {
  try {
    const verificationCode = req.params.verificationCode as string;

    const certificate = await prisma.certificate.findUnique({
      where: { verificationCode },
      include: {
        student: { select: { firstName: true, lastName: true } },
        enrollment: {
          include: {
            course: {
              select: {
                title: true,
                instructor: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    if (!certificate) {
      res.status(404).json(ApiResponse.error('Certifikata nuk u gjet'));
      return;
    }

    res.json(ApiResponse.success({
      studentName: `${certificate.student.firstName} ${certificate.student.lastName}`,
      courseName: certificate.enrollment.course.title,
      instructorName: `${certificate.enrollment.course.instructor.firstName} ${certificate.enrollment.course.instructor.lastName}`,
      issuedAt: certificate.issuedAt,
      certificateNumber: certificate.certificateNumber,
      isValid: true,
    }));
  } catch (error) {
    console.error('VerifyCertificate error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te verifikonte certifikaten'));
  }
};

export const downloadCertificate = async (req: Request, res: Response): Promise<void> => {
  try {
    const certificateId = req.params.id as string;
    const studentId = req.user!.id;

    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      select: { id: true, studentId: true, certificateNumber: true },
    });

    if (!certificate) {
      res.status(404).json(ApiResponse.error('Certifikata nuk u gjet'));
      return;
    }

    if (certificate.studentId !== studentId) {
      res.status(403).json(ApiResponse.error('Nuk keni akses ne kete certifikate'));
      return;
    }

    const pdfBuffer = await pdfService.getCertificatePDF(certificateId);

    if (!pdfBuffer) {
      res.status(500).json(ApiResponse.error('Deshtoi te gjeneronte PDF'));
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="certificate-${certificate.certificateNumber}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('DownloadCertificate error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te shkarkonte certifikaten'));
  }
};

export const getMyCertificates = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;

    const certificates = await prisma.certificate.findMany({
      where: { studentId },
      orderBy: { issuedAt: 'desc' },
      include: {
        enrollment: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                thumbnailUrl: true,
                instructor: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    const result = certificates.map((cert) => ({
      id: cert.id,
      certificateNumber: cert.certificateNumber,
      verificationCode: cert.verificationCode,
      issuedAt: cert.issuedAt,
      pdfUrl: cert.pdfUrl,
      course: {
        id: cert.enrollment.course.id,
        title: cert.enrollment.course.title,
        thumbnailUrl: cert.enrollment.course.thumbnailUrl,
        instructorName: `${cert.enrollment.course.instructor.firstName} ${cert.enrollment.course.instructor.lastName}`,
      },
    }));

    res.json(ApiResponse.success(result));
  } catch (error) {
    console.error('GetMyCertificates error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte certifikatat'));
  }
};
