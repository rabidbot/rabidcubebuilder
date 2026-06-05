import { getCardImageUrl } from '../../lib/scryfall';
import type { ScryfallCard } from '../../lib/types';

interface CardPreviewProps {
  card: ScryfallCard;
  size?: 'small' | 'normal' | 'large';
  className?: string;
}

export default function CardPreview({ card, size = 'small', className = '' }: CardPreviewProps) {
  const url = getCardImageUrl(card, size);
  if (!url) {
    return (
      <div className={`bg-card rounded text-text-muted text-xs flex items-center justify-center ${className}`}>
        {card.name}
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={card.name}
      className={className}
      loading="lazy"
      style={{ width: size === 'small' ? '96px' : size === 'normal' ? '244px' : '336px' }}
    />
  );
}
