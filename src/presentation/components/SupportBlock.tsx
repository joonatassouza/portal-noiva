import { useTranslations } from 'next-intl';
import { ChurchPix } from '@/domain/entities/Church';

interface SupportBlockProps {
  pix: ChurchPix;
}

/**
 * Informational PIX block. The platform NEVER mediates transactions;
 * this is just an image + key the visitor can copy/scan in their bank app.
 */
export function SupportBlock({ pix }: SupportBlockProps) {
  const t = useTranslations('church');
  if (!pix.pixKey && !pix.pixQrcodeImageUrl) return null;

  return (
    <div>
      <p className="text-xs text-muted">{t('supportNote')}</p>
      {pix.pixQrcodeImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pix.pixQrcodeImageUrl}
          alt="QR Code PIX"
          className="mt-3 aspect-square w-40 rounded-md border border-border bg-bg p-2"
        />
      )}
      {pix.pixKey && (
        <p className="mt-3 break-all font-mono text-xs text-ink">{pix.pixKey}</p>
      )}
    </div>
  );
}
