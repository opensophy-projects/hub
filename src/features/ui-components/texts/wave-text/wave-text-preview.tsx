import WaveText from './wave-text';

const WaveTextPreview: React.FC = () => (
  <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
    <WaveText amplitude={8} duration={1.2} staggerDelay={0.05} className="text-4xl font-bold">
      Волновой текст
    </WaveText>
  </div>
);

export default WaveTextPreview;