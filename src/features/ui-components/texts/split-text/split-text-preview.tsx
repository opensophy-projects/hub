import SplitText from './split-text';

const SplitTextPreview: React.FC = () => (
  <div style={{ padding: '2rem 1rem' }}>
    <SplitText
      text="Привет, это Split Text!"
      className="text-4xl font-bold"
      splitType="chars"
      delay={50}
      duration={1.25}
      ease="power3.out"
      textAlign="center"
    />
  </div>
);

export default SplitTextPreview;