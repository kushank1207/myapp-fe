import React from 'react';

function Card({ title, description, image, borderColor }) {
  return (
    <div className={`p-4 bg-white border-2 ${borderColor} rounded-lg w-64 h-80`}>
      <img src={image} alt={title} className="w-full h-32 object-cover rounded-t-lg" />
      <div className="p-2">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

export default Card;
