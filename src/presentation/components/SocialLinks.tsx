import { ChurchSocial } from '@/domain/entities/Church';
import { ExternalLink } from '@/presentation/components/ui/ExternalLink';

interface SocialLinksProps {
  social: ChurchSocial;
}

/** List of a church's external social links. Renders nothing if all are empty. */
export function SocialLinks({ social }: SocialLinksProps) {
  const hasAny =
    social.websiteUrl || social.youtubeUrl || social.instagramUrl || social.facebookUrl;
  if (!hasAny) return null;

  return (
    <ul className="space-y-1.5 text-sm">
      {social.websiteUrl && (
        <li>
          <ExternalLink href={social.websiteUrl}>Site oficial</ExternalLink>
        </li>
      )}
      {social.youtubeUrl && (
        <li>
          <ExternalLink href={social.youtubeUrl}>YouTube</ExternalLink>
        </li>
      )}
      {social.instagramUrl && (
        <li>
          <ExternalLink href={social.instagramUrl}>Instagram</ExternalLink>
        </li>
      )}
      {social.facebookUrl && (
        <li>
          <ExternalLink href={social.facebookUrl}>Facebook</ExternalLink>
        </li>
      )}
    </ul>
  );
}
