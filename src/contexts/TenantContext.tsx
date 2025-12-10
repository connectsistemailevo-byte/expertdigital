import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TenantBranding {
  providerId: string | null;
  providerName: string | null;
  companyName: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  slug: string | null;
  customDomain: string | null;
  isWhiteLabel: boolean; // true se está acessando via subdomínio/domínio personalizado
  isLoading: boolean;
}

interface TenantContextType extends TenantBranding {
  refreshTenant: () => Promise<void>;
}

const defaultBranding: TenantBranding = {
  providerId: null,
  providerName: null,
  companyName: null,
  logoUrl: null,
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
  slug: null,
  customDomain: null,
  isWhiteLabel: false,
  isLoading: true,
};

const TenantContext = createContext<TenantContextType>({
  ...defaultBranding,
  refreshTenant: async () => {},
});

export const useTenant = () => useContext(TenantContext);

interface TenantProviderProps {
  children: ReactNode;
}

// Domínios principais que NÃO são white-label
const MAIN_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'lovable.app',
  'lovableproject.com',
  // Adicione aqui seu domínio principal quando definir
];

function isMainDomain(hostname: string): boolean {
  return MAIN_DOMAINS.some(domain => 
    hostname === domain || 
    hostname.endsWith(`.${domain}`)
  );
}

function extractSlugFromHostname(hostname: string): string | null {
  // Se for domínio principal, não tem slug
  if (isMainDomain(hostname)) {
    return null;
  }

  // Extrai o subdomínio (primeira parte antes do primeiro ponto)
  // Ex: joao.seudominio.com -> joao
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }

  // Se for domínio próprio (sem subdomínio), retorna o hostname completo
  // para buscar por custom_domain
  return null;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [branding, setBranding] = useState<TenantBranding>(defaultBranding);

  const loadTenantData = async () => {
    const hostname = window.location.hostname;
    
    // Se for domínio principal, não é white-label
    if (isMainDomain(hostname)) {
      setBranding({
        ...defaultBranding,
        isWhiteLabel: false,
        isLoading: false,
      });
      return;
    }

    try {
      // Primeiro, tenta buscar por subdomínio (slug)
      const slug = extractSlugFromHostname(hostname);
      
      let provider = null;
      let customization = null;

      if (slug) {
        // Busca provider pelo slug
        const { data: providerData } = await supabase
          .from('providers')
          .select('*')
          .eq('slug', slug)
          .single();
        
        if (providerData) {
          provider = providerData;
        }
      }

      // Se não encontrou por slug, tenta por domínio customizado
      if (!provider) {
        const { data: customData } = await supabase
          .from('provider_customization')
          .select('*, providers!inner(*)')
          .eq('custom_domain', hostname)
          .single();

        if (customData) {
          customization = customData;
          provider = (customData as any).providers;
        }
      }

      // Se encontrou provider, busca customização
      if (provider && !customization) {
        const { data: customData } = await supabase
          .from('provider_customization')
          .select('*')
          .eq('provider_id', provider.id)
          .single();
        
        if (customData) {
          customization = customData;
        }
      }

      if (provider) {
        setBranding({
          providerId: provider.id,
          providerName: provider.name,
          companyName: customization?.company_name || provider.name,
          logoUrl: customization?.logo_url || null,
          primaryColor: customization?.primary_color || '#6366f1',
          secondaryColor: customization?.secondary_color || '#8b5cf6',
          slug: provider.slug,
          customDomain: customization?.custom_domain || null,
          isWhiteLabel: true,
          isLoading: false,
        });

        // Aplica as cores customizadas como CSS variables
        applyBrandingColors(
          customization?.primary_color || '#6366f1',
          customization?.secondary_color || '#8b5cf6'
        );
      } else {
        // Domínio não reconhecido
        setBranding({
          ...defaultBranding,
          isWhiteLabel: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados do tenant:', error);
      setBranding({
        ...defaultBranding,
        isWhiteLabel: false,
        isLoading: false,
      });
    }
  };

  const applyBrandingColors = (primary: string, secondary: string) => {
    // Converte hex para HSL e aplica como CSS variables
    const root = document.documentElement;
    
    // Converte hex para HSL
    const primaryHsl = hexToHsl(primary);
    const secondaryHsl = hexToHsl(secondary);
    
    if (primaryHsl) {
      root.style.setProperty('--primary', `${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}%`);
    }
    if (secondaryHsl) {
      root.style.setProperty('--accent', `${secondaryHsl.h} ${secondaryHsl.s}% ${secondaryHsl.l}%`);
    }
  };

  useEffect(() => {
    loadTenantData();
  }, []);

  return (
    <TenantContext.Provider value={{ ...branding, refreshTenant: loadTenantData }}>
      {children}
    </TenantContext.Provider>
  );
};

// Função auxiliar para converter hex para HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  if (!hex) return null;
  
  // Remove o # se existir
  hex = hex.replace('#', '');
  
  // Converte para RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}
