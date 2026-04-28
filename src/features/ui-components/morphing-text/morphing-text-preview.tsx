import MorphingText from './morphing-text';

interface MorphingTextPreviewProps {
  texts?: string;
  className?: string;
}

const MorphingTextPreview: React.FC<MorphingTextPreviewProps> = ({
  texts = 'Дизайн, Интерфейс, Анимация, Движение',
  className = '',
}) => {
  const textsArray = texts
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  return <MorphingText texts={textsArray} className={className} />;
};

export default MorphingTextPreview;