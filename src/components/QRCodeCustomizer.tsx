import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Palette, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeCustomizerProps {
  providerSlug: string;
  providerName: string;
  onSave?: (colors: { primary: string; background: string; logoUrl?: string }) => void;
  initialColors?: { primary: string; background: string; logoUrl?: string };
}

const QRCodeCustomizer: React.FC<QRCodeCustomizerProps> = ({
  providerSlug,
  providerName,
  onSave,
  initialColors
}) => {
  const [primaryColor, setPrimaryColor] = useState(initialColors?.primary || '#1a1a2e');
  const [backgroundColor, setBackgroundColor] = useState(initialColors?.background || '#ffffff');
  const [logoUrl, setLogoUrl] = useState(initialColors?.logoUrl || '');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const providerUrl = `https://akiguincho24hs.lovable.app/p/${providerSlug}`;
  const size = 200;

  useEffect(() => {
    if (logoUrl) {
      setLogoPreview(logoUrl);
    }
  }, [logoUrl]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) {
        toast.error('A imagem deve ter no máximo 500KB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setLogoPreview(result);
        setLogoUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetColors = () => {
    setPrimaryColor('#1a1a2e');
    setBackgroundColor('#ffffff');
    setLogoUrl('');
    setLogoPreview(null);
    toast.success('Cores restauradas para o padrão');
  };

  const downloadQRCode = () => {
    if (!qrRef.current) return;
    
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padding = 30;
    const logoSize = logoPreview ? 50 : 0;
    canvas.width = size + padding * 2;
    canvas.height = size + padding * 2 + 50;

    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Convert SVG to image
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, padding, padding, size, size);
      
      // Draw provider name
      ctx.fillStyle = primaryColor;
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(providerName, canvas.width / 2, size + padding + 35);
      
      const link = document.createElement('a');
      link.download = `qrcode-${providerSlug}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      URL.revokeObjectURL(svgUrl);
      toast.success('QR Code baixado com sucesso!');
    };
    img.src = svgUrl;
  };

  const handleSave = () => {
    if (onSave) {
      onSave({ primary: primaryColor, background: backgroundColor, logoUrl: logoPreview || undefined });
      toast.success('Personalização salva!');
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Palette className="w-5 h-5 text-secondary" />
          Personalizar QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preview */}
        <div className="flex justify-center">
          <div 
            ref={qrRef}
            className="p-4 rounded-xl shadow-lg transition-all"
            style={{ backgroundColor }}
          >
            <QRCodeSVG 
              value={providerUrl}
              size={size}
              level="H"
              includeMargin={false}
              bgColor={backgroundColor}
              fgColor={primaryColor}
              imageSettings={logoPreview ? {
                src: logoPreview,
                height: 40,
                width: 40,
                excavate: true
              } : undefined}
            />
          </div>
        </div>

        {/* Color Pickers */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primaryColor" className="text-sm">Cor do QR Code</Label>
            <div className="flex gap-2">
              <Input
                id="primaryColor"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 text-xs"
                placeholder="#000000"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bgColor" className="text-sm">Cor de Fundo</Label>
            <div className="flex gap-2">
              <Input
                id="bgColor"
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="flex-1 text-xs"
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>

        {/* Logo Upload */}
        <div className="space-y-2">
          <Label className="text-sm">Logo (opcional)</Label>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              {logoPreview ? 'Trocar Logo' : 'Adicionar Logo'}
            </Button>
            {logoPreview && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  setLogoPreview(null);
                  setLogoUrl('');
                }}
              >
                Remover
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground">
            Imagem PNG ou JPG, máximo 500KB
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={resetColors}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Restaurar
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={downloadQRCode}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Baixar
          </Button>
          
          {onSave && (
            <Button 
              size="sm"
              onClick={handleSave}
              className="gap-2 ml-auto bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              Salvar Cores
            </Button>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Escaneie para acessar: {providerUrl}
        </p>
      </CardContent>
    </Card>
  );
};

export default QRCodeCustomizer;
