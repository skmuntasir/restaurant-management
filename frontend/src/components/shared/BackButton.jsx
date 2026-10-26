import React from 'react';
import { IoArrowBackOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

const BackButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      aria-label="Go back"
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-tint/10 bg-tint/5 text-xl text-ink transition-all hover:-translate-x-0.5 hover:border-[#F6B100]/50 hover:bg-[#F6B100]/10 hover:text-accent"
    >
      <IoArrowBackOutline />
    </button>
  );
};

export default BackButton;
