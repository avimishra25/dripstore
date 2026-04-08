import React from 'react';
import './RatingStars.css';

const RatingStars = ({ rating = 0, numReviews = 0, small = false, interactive = false, onRate }) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={`rating-stars ${small ? 'small' : ''} ${interactive ? 'interactive' : ''}`}>
      <div className="stars">
        {stars.map((star) => (
          <span
            key={star}
            className={`star ${star <= Math.round(rating) ? 'filled' : 'empty'}`}
            onClick={interactive ? () => onRate(star) : undefined}
            role={interactive ? 'button' : undefined}
          >
            ★
          </span>
        ))}
      </div>
      {!small && numReviews > 0 && (
        <span className="review-count">({numReviews} {numReviews === 1 ? 'review' : 'reviews'})</span>
      )}
      {small && numReviews > 0 && (
        <span className="review-count-small">{numReviews}</span>
      )}
    </div>
  );
};

export default RatingStars;
