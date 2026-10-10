import React from 'react';
import './RatingStars.css';
const RatingStars = ({ rating = 0, numReviews = 0, small = false, interactive = false, onRate }) => {
  const Star = interactive ? 'button' : 'span';
  return <div className={`rating-stars ${small ? 'small' : ''} ${interactive ? 'interactive' : ''}`}>
    <div className="stars" aria-label={interactive ? 'Choose a rating' : `Rated ${rating.toFixed(1)} out of 5`}>
      {[1,2,3,4,5].map(star => <Star key={star} type={interactive ? 'button' : undefined} className={`star ${star <= Math.round(rating) ? 'filled' : 'empty'}`} aria-label={interactive ? `${star} stars` : undefined} aria-pressed={interactive ? star === rating : undefined} onClick={interactive ? () => onRate(star) : undefined}>★</Star>)}
    </div>
    {numReviews > 0 && <span className={small ? 'review-count-small' : 'review-count'}>{numReviews}{!small && ' reviews'}</span>}
  </div>;
};
export default RatingStars;
