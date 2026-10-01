import React, { useState } from 'react';
import { Star } from 'lucide-react';

export default function StarRating({
  rating = 0,
  maxRating = 5,
  interactive = false,
  onChange = () => {},
  size = 18,
  showValue = false
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {Array.from({ length: maxRating }, (_, index) => {
          const starValue = index + 1;
          const isFilled = displayRating >= starValue;
          const isHalf = !interactive && displayRating >= starValue - 0.5 && displayRating < starValue;

          return (
            <button
              key={starValue}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 2,
                cursor: interactive ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.15s ease',
                transform: interactive && hoverRating === starValue ? 'scale(1.2)' : 'none'
              }}
              title={interactive ? `Rate ${starValue} star${starValue > 1 ? 's' : ''}` : `${rating} stars`}
            >
              <Star
                size={size}
                fill={isFilled ? 'var(--gold-star)' : isHalf ? 'url(#halfStarGrad)' : 'transparent'}
                color={isFilled || isHalf ? 'var(--gold-star)' : 'var(--text-dim)'}
                strokeWidth={isFilled ? 0 : 1.5}
              />
            </button>
          );
        })}
      </div>

      {showValue && (
        <span style={{
          fontSize: '0.88rem',
          fontWeight: 700,
          color: displayRating > 0 ? 'var(--gold-star)' : 'var(--text-dim)',
          marginLeft: 2
        }}>
          {displayRating > 0 ? Number(displayRating).toFixed(1) : 'No ratings'}
        </span>
      )}
    </div>
  );
}
