const t=`import RotatingText from './rotating-text';

const RotatingTextPreview: React.FC = () => (
  <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
    <RotatingText
      texts={['Дизайн', 'Интерфейс', 'Анимация', 'Движение']}
      rotationInterval={2000}
      splitBy="characters"
      staggerDuration={0.03}
      staggerFrom="first"
      loop
      auto
      animatePresenceMode="wait"
      mainClassName="text-4xl font-bold overflow-hidden justify-center"
    />
  </div>
);

export default RotatingTextPreview;`;export{t as default};
