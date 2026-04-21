
export const Img = ({src}: {src: string}) => {
  return (
    <img
      src={src}
      style={{
        width: '100%',
        maxWidth: 1000,
        borderRadius: 3,
      }}
    />
  );
}
