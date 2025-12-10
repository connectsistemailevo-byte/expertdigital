import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  Palette,
  Upload,
  Loader2,
  Save,
  Globe,
  Building2,
  Image as ImageIcon,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  whatsapp: string;
  slug: string | null;
}

interface Customization {
  id: string;
  provider_id: string;
  company_name: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  custom_domain: string | null;
}

interface BrandingManagerProps {
  providers: Provider[];
  onUpdate?: () => void;
}

export default function BrandingManager({ providers, onUpdate }: BrandingManagerProps) {
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [customization, setCustomization] = useState<Customization | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(false);
  
  // Form fields
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [secondaryColor, setSecondaryColor] = useState('#8b5cf6');
  const [customDomain, setCustomDomain] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedProvider = providers.find(p => p.id === selectedProviderId);

  // Carregar customização quando selecionar provider
  useEffect(() => {
    if (selectedProviderId) {
      loadCustomization();
    } else {
      resetForm();
    }
  }, [selectedProviderId]);

  const resetForm = () => {
    setCustomization(null);
    setCompanyName('');
    setLogoUrl('');
    setPrimaryColor('#6366f1');
    setSecondaryColor('#8b5cf6');
    setCustomDomain('');
  };

  const loadCustomization = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('provider_customization')
        .select('*')
        .eq('provider_id', selectedProviderId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setCustomization(data);
        setCompanyName(data.company_name || '');
        setLogoUrl(data.logo_url || '');
        setPrimaryColor(data.primary_color || '#6366f1');
        setSecondaryColor(data.secondary_color || '#8b5cf6');
        setCustomDomain(data.custom_domain || '');
      } else {
        // Criar customização padrão se não existir
        const provider = providers.find(p => p.id === selectedProviderId);
        setCompanyName(provider?.name || '');
        setLogoUrl('');
        setPrimaryColor('#6366f1');
        setSecondaryColor('#8b5cf6');
        setCustomDomain('');
      }
    } catch (err: any) {
      console.error('Erro ao carregar customização:', err);
      toast({
        title: 'Erro ao carregar dados',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione uma imagem (JPG, PNG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O logo deve ter no máximo 2MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedProviderId}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Fazer upload
      const { error: uploadError } = await supabase.storage
        .from('provider-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('provider-logos')
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);
      toast({
        title: 'Logo enviado!',
        description: 'Não esqueça de salvar as alterações.',
      });
    } catch (err: any) {
      console.error('Erro ao fazer upload:', err);
      toast({
        title: 'Erro no upload',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedProviderId) return;

    setSaving(true);
    try {
      const updateData = {
        provider_id: selectedProviderId,
        company_name: companyName || null,
        logo_url: logoUrl || null,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        custom_domain: customDomain || null,
      };

      if (customization) {
        // Atualizar
        const { error } = await supabase
          .from('provider_customization')
          .update(updateData)
          .eq('id', customization.id);

        if (error) throw error;
      } else {
        // Inserir
        const { error } = await supabase
          .from('provider_customization')
          .insert(updateData);

        if (error) throw error;
      }

      toast({
        title: 'Branding salvo!',
        description: 'As alterações foram aplicadas com sucesso.',
      });

      onUpdate?.();
      loadCustomization();
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      toast({
        title: 'Erro ao salvar',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const copySlugUrl = () => {
    if (selectedProvider?.slug) {
      // TODO: Substituir pelo seu domínio real
      const url = `https://${selectedProvider.slug}.seudominio.com`;
      navigator.clipboard.writeText(url);
      setCopiedSlug(true);
      setTimeout(() => setCopiedSlug(false), 2000);
      toast({ title: 'URL copiada!' });
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Gerenciar Branding (White-Label)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seletor de Prestador */}
        <div>
          <Label className="text-slate-300">Selecione o Prestador</Label>
          <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
            <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
              <SelectValue placeholder="Escolha um prestador..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    {provider.name}
                    {provider.slug && (
                      <span className="text-xs text-slate-500">({provider.slug})</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedProviderId && loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        )}

        {selectedProviderId && !loading && (
          <div className="space-y-6">
            {/* Slug/Subdomínio Info */}
            {selectedProvider?.slug && (
              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <Label className="text-slate-300 text-xs">Subdomínio do Prestador</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 px-3 py-2 bg-slate-800 rounded text-emerald-400 text-sm">
                    {selectedProvider.slug}.seudominio.com
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600"
                    onClick={copySlugUrl}
                  >
                    {copiedSlug ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Nome da Empresa */}
            <div>
              <Label className="text-slate-300">Nome da Empresa</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Nome que aparece no site"
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>

            {/* Upload de Logo */}
            <div>
              <Label className="text-slate-300">Logo</Label>
              <div className="flex items-center gap-4 mt-2">
                {logoUrl ? (
                  <div className="w-20 h-20 rounded-lg bg-slate-700 border border-slate-600 overflow-hidden">
                    <img 
                      src={logoUrl} 
                      alt="Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-slate-500" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Logo
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-slate-500">PNG ou JPG, máx. 2MB</p>
                </div>
              </div>
            </div>

            {/* Cores */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Cor Primária</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-300">Cor Secundária</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Preview de Cores */}
            <div className="p-4 rounded-lg border border-slate-600" style={{ backgroundColor: primaryColor + '20' }}>
              <p className="text-xs text-slate-400 mb-2">Preview</p>
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {companyName?.charAt(0)?.toUpperCase() || 'P'}
                </div>
                <div>
                  <p className="font-bold text-white">{companyName || 'Nome da Empresa'}</p>
                  <p className="text-xs" style={{ color: secondaryColor }}>Serviços de Guincho</p>
                </div>
              </div>
            </div>

            {/* Domínio Próprio */}
            <div>
              <Label className="text-slate-300 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Domínio Próprio (Plano Pro)
              </Label>
              <Input
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="guinchojoao.com.br"
                className="bg-slate-800 border-slate-600 text-white mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">
                Lembre de adicionar este domínio na Vercel e configurar o DNS
              </p>
            </div>

            {/* Botão Salvar */}
            <Button
              className="w-full bg-gradient-to-r from-primary to-purple-600"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Branding
                </>
              )}
            </Button>
          </div>
        )}

        {!selectedProviderId && (
          <div className="text-center py-8 text-slate-500">
            <Palette className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Selecione um prestador para gerenciar o branding</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
