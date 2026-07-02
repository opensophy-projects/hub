const e=`import BlurText from './BlurText';

const BlurTextPreview: React.FC = () => (
  <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
    <BlurText
      text="Добро пожаловать в будущее веб-дизайна"
      delay={200}
      animateBy="words"
      direction="top"
      className="text-4xl font-bold text-center"
    />
  </div>
);

export default BlurTextPreview;`;export{e as default};
