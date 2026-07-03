import QRCode from "react-qr-code";

type ResponsiveQrCodeProps = {
  value: string;
  title: string;
  size?: number;
  className?: string;
};

export function ResponsiveQrCode({
  value,
  title,
  size = 200,
  className = "h-auto w-full max-w-[200px]",
}: ResponsiveQrCodeProps) {
  return (
    <QRCode
      value={value}
      size={size}
      fgColor="#166534"
      bgColor="#ffffff"
      title={title}
      className={className}
    />
  );
}
