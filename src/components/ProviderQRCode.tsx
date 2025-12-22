import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Download, QrCode } from 'lucide-react';
import { toast } from 'sonner';

interface ProviderQRCodeProps {
  providerSlug: string;
  providerName: string;
  size?: number;
}

const ProviderQRCode: React.FC<ProviderQRCodeProps> = ({ 
  providerSlug, 
  providerName,
  size = 180 
}) => {
  const qrRef = useRef<HTMLDivElement>(null);
  
  const providerUrl = `https://akiguincho24hs.lovable.app/p/${providerSlug}`;

  const downloadQRCode = () => {
    if (!qrRef.current) return;
    
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with padding
    const padding = 20;
    canvas.width = size + padding * 2;
    canvas.height = size + padding * 2 + 40; // Extra space for text

    // Draw white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Convert SVG to image
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      // Draw QR code
      ctx.drawImage(img, padding, padding, size, size);
      
      // Draw provider name below
      ctx.fillStyle = '#1a1a2e';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(providerName, canvas.width / 2, size + padding + 25);
      
      // Download
      const link = document.createElement('a');
      link.download = `qrcode-${providerSlug}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      URL.revokeObjectURL(svgUrl);
      toast.success('QR Code baixado com sucesso!');
    };
    img.src = svgUrl;
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div 
        ref={qrRef}
        className="bg-white p-3 rounded-xl shadow-lg"
      >
        <QRCodeSVG 
          value={providerUrl}
          size={size}
          level="H"
          includeMargin={false}
          bgColor="#ffffff"
          fgColor="#1a1a2e"
        />
      </div>
      
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-2">
          Escaneie para acessar seu guincho digital
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={downloadQRCode}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Baixar QR Code
        </Button>
      </div>
    </div>
  );
};

export default ProviderQRCode;
