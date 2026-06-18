import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  fallbackTo?: string;
  label?: string;
}

export default function BackButton({
  fallbackTo = '/',
  label = 'Volver atras',
}: BackButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallbackTo);
  };

  return (
    <button className="back-link" onClick={handleBack} type="button">
      <ArrowLeft size={16} /> {label}
    </button>
  );
}
