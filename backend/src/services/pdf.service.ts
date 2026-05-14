import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import { prisma } from './prisma';
import { config } from '../config';
import * as fs from 'fs';
import * as path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'certificates');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const pdfService = {
  async generateCertificate(certificateId: string): Promise<Buffer> {
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
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
      throw new Error('Certificate not found');
    }

    const studentName = `${certificate.student.firstName} ${certificate.student.lastName}`;
    const courseName = certificate.enrollment.course.title;
    const instructorName = `${certificate.enrollment.course.instructor.firstName} ${certificate.enrollment.course.instructor.lastName}`;
    const completionDate = certificate.issuedAt.toLocaleDateString('sq-AL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const verificationUrl = `${config.frontendUrl}/verify/${certificate.verificationCode}`;

    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 100,
      margin: 1,
      color: { dark: '#334155', light: '#ffffff' },
    });

    const html = generateCertificateHTML({
      studentName,
      courseName,
      instructorName,
      completionDate,
      certificateNumber: certificate.certificateNumber,
      verificationCode: certificate.verificationCode,
      qrCodeDataUrl,
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    await browser.close();

    const fileName = `${certificate.certificateNumber}.pdf`;
    const filePath = path.join(UPLOADS_DIR, fileName);
    fs.writeFileSync(filePath, pdfBuffer);

    await prisma.certificate.update({
      where: { id: certificateId },
      data: { pdfUrl: `/uploads/certificates/${fileName}` },
    });

    return Buffer.from(pdfBuffer);
  },

  async getCertificatePDF(certificateId: string): Promise<Buffer | null> {
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      select: { pdfUrl: true, certificateNumber: true },
    });

    if (!certificate?.pdfUrl) {
      return this.generateCertificate(certificateId);
    }

    const filePath = path.join(process.cwd(), certificate.pdfUrl);
    if (!fs.existsSync(filePath)) {
      return this.generateCertificate(certificateId);
    }

    return fs.readFileSync(filePath);
  },
};

interface CertificateData {
  studentName: string;
  courseName: string;
  instructorName: string;
  completionDate: string;
  certificateNumber: string;
  verificationCode: string;
  qrCodeDataUrl: string;
}

function generateCertificateHTML(data: CertificateData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      width: 297mm;
      height: 210mm;
      font-family: 'Inter', sans-serif;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    }

    .certificate {
      width: 100%;
      height: 100%;
      padding: 15mm;
      position: relative;
    }

    .border-outer {
      width: 100%;
      height: 100%;
      border: 3px solid #6366f1;
      padding: 5mm;
      position: relative;
    }

    .border-inner {
      width: 100%;
      height: 100%;
      border: 1px solid #94a3b8;
      padding: 10mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      background: white;
    }

    .corner {
      position: absolute;
      width: 30px;
      height: 30px;
      border: 3px solid #6366f1;
    }

    .corner-tl { top: 5mm; left: 5mm; border-right: none; border-bottom: none; }
    .corner-tr { top: 5mm; right: 5mm; border-left: none; border-bottom: none; }
    .corner-bl { bottom: 5mm; left: 5mm; border-right: none; border-top: none; }
    .corner-br { bottom: 5mm; right: 5mm; border-left: none; border-top: none; }

    .header {
      text-align: center;
    }

    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 8mm;
    }

    .logo-icon {
      width: 50px;
      height: 50px;
      background: #6366f1;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 28px;
      font-weight: bold;
      font-family: 'Inter', sans-serif;
    }

    .logo-text {
      font-size: 28px;
      font-weight: 600;
      color: #1e293b;
      font-family: 'Inter', sans-serif;
    }

    .title {
      font-family: 'Playfair Display', serif;
      font-size: 42px;
      font-weight: 600;
      color: #6366f1;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin-bottom: 3mm;
    }

    .subtitle {
      font-size: 14px;
      color: #64748b;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .content {
      text-align: center;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .presented-to {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 5mm;
      letter-spacing: 1px;
    }

    .student-name {
      font-family: 'Playfair Display', serif;
      font-size: 48px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 8mm;
    }

    .completion-text {
      font-size: 16px;
      color: #475569;
      margin-bottom: 5mm;
    }

    .course-name {
      font-size: 24px;
      font-weight: 600;
      color: #6366f1;
      margin-bottom: 8mm;
    }

    .date {
      font-size: 14px;
      color: #64748b;
    }

    .footer {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 5mm;
    }

    .signature-section {
      text-align: center;
    }

    .signature-line {
      width: 150px;
      border-top: 2px solid #cbd5e1;
      margin-bottom: 5px;
    }

    .instructor-name {
      font-size: 14px;
      font-weight: 500;
      color: #1e293b;
    }

    .instructor-title {
      font-size: 12px;
      color: #64748b;
    }

    .verification {
      text-align: center;
    }

    .qr-code img {
      width: 80px;
      height: 80px;
      margin-bottom: 5px;
    }

    .cert-number {
      font-size: 10px;
      color: #94a3b8;
      font-family: monospace;
    }

    .verify-text {
      font-size: 9px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="border-outer">
      <div class="corner corner-tl"></div>
      <div class="corner corner-tr"></div>
      <div class="corner corner-bl"></div>
      <div class="corner corner-br"></div>

      <div class="border-inner">
        <div class="header">
          <div class="logo">
            <div class="logo-icon">Z</div>
            <span class="logo-text">ZK-LMS</span>
          </div>
          <h1 class="title">Certifikate</h1>
          <p class="subtitle">Perfundimi me Sukses</p>
        </div>

        <div class="content">
          <p class="presented-to">Kjo certifikate i jepet</p>
          <h2 class="student-name">${data.studentName}</h2>
          <p class="completion-text">per perfundimin me sukses te kursit</p>
          <h3 class="course-name">${data.courseName}</h3>
          <p class="date">Kompletuar me ${data.completionDate}</p>
        </div>

        <div class="footer">
          <div class="signature-section">
            <div class="signature-line"></div>
            <p class="instructor-name">${data.instructorName}</p>
            <p class="instructor-title">Instruktor</p>
          </div>

          <div class="verification">
            <div class="qr-code">
              <img src="${data.qrCodeDataUrl}" alt="QR Code" />
            </div>
            <p class="cert-number">${data.certificateNumber}</p>
            <p class="verify-text">Skano per verifikim</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
