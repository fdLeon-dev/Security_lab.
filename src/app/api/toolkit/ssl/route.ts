import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as tls from "tls";
import { saveToolkitReport } from "@/server/modules/toolkit/toolkit.service";

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;

const schema = z.object({
  domain: z
    .string()
    .min(3)
    .max(253)
    .regex(DOMAIN_RE, "Invalid domain name"),
  port: z.number().int().min(1).max(65535).optional(),
});

type CertInfo = {
  subject: Record<string, string>;
  issuer: Record<string, string>;
  validFrom: string;
  validTo: string;
  fingerprint: string;
  daysRemaining: number;
};

export async function POST(request: NextRequest) {
  try {
    const { domain, port = 443 } = schema.parse(await request.json());

    const cert = await new Promise<CertInfo>((resolve, reject) => {
      const socket = tls.connect(
        { host: domain, port, servername: domain, rejectUnauthorized: false, timeout: 8000 },
        () => {
          const peerCert = socket.getPeerCertificate();
          socket.destroy();
          if (!peerCert || !peerCert.valid_to) {
            reject(new Error("No certificate found"));
            return;
          }
          const validTo = new Date(peerCert.valid_to);
          const now = new Date();
          const daysRemaining = Math.floor(
            (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          resolve({
            subject: peerCert.subject as unknown as Record<string, string>,
            issuer: peerCert.issuer as unknown as Record<string, string>,
            validFrom: peerCert.valid_from,
            validTo: peerCert.valid_to,
            fingerprint: peerCert.fingerprint ?? "",
            daysRemaining,
          });
        }
      );
      socket.on("error", reject);
      socket.setTimeout(8000, () => {
        socket.destroy();
        reject(new Error("Connection timeout"));
      });
    });

    await saveToolkitReport("ssl_checker", `${domain}:${port}`, JSON.stringify(cert));
    return NextResponse.json({ domain, port, cert });
  } catch {
    return NextResponse.json({ error: "Unable to retrieve SSL certificate" }, { status: 400 });
  }
}
