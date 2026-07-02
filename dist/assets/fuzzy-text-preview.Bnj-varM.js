const e=`import FuzzyText from './fuzzy-text';

const FuzzyTextPreview: React.FC = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    background: '#111',
    borderRadius: 12,
  }}>
    <FuzzyText
      fontSize="clamp(2rem, 8vw, 6rem)"
      fontWeight={900}
      color="#fff"
      baseIntensity={0.18}
      hoverIntensity={0.5}
      enableHover
    >
      Fuzzy
    </FuzzyText>
  </div>
);

export default FuzzyTextPreview;`;export{e as default};
