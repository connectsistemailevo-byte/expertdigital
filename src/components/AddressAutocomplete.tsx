import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2, Building2, Search, Mail } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';

export interface DestinationCoordinates {
  latitude: number;
  longitude: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, coordinates?: DestinationCoordinates) => void;
  placeholder?: string;
  className?: string;
}

interface Suggestion {
  id: string;
  name: string;
  full_address: string;
  isPOI: boolean;
  coordinates?: [number, number]; // [longitude, latitude]
  mapbox_id?: string;
  type?: string;
}

// Palavras que indicam busca por POI/estabelecimento
const POI_KEYWORDS = [
  'shopping', 'mall', 'mercado', 'supermercado', 'hospital', 
  'hotel', 'restaurante', 'farmacia', 'farmácia', 'posto', 'banco',
  'escola', 'faculdade', 'universidade', 'igreja', 'academia',
  'oficina', 'concessionaria', 'concessionária', 'loja', 'centro comercial',
  'aeroporto', 'rodoviária', 'rodoviaria', 'terminal'
];

// Detecta se é um CEP brasileiro (formato: XXXXX-XXX ou XXXXXXXX)
const isCEP = (query: string): boolean => {
  const cleaned = query.replace(/\D/g, '');
  return cleaned.length === 8;
};

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Digite endereço, cidade ou CEP",
  className = "",
}) => {
  const { mapboxToken, location } = useLocation();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const sessionTokenRef = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Detecta se a busca é por POI
  const isPOISearch = (query: string): boolean => {
    const lowerQuery = query.toLowerCase();
    return POI_KEYWORDS.some(keyword => lowerQuery.includes(keyword));
  };

  // Busca por CEP usando ViaCEP (API gratuita brasileira)
  const searchByCEP = async (cep: string): Promise<boolean> => {
    const cleanCep = cep.replace(/\D/g, '');
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        return false;
      }
      
      // Construir endereço completo para geocodificar
      const fullAddress = `${data.logradouro}, ${data.bairro}, ${data.localidade}, ${data.uf}, Brasil`;
      
      // Usar Mapbox para obter coordenadas do endereço
      if (mapboxToken) {
        const geoResponse = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${mapboxToken}&country=br&language=pt&limit=1`
        );
        const geoData = await geoResponse.json();
        
        if (geoData.features && geoData.features.length > 0) {
          const feature = geoData.features[0];
          setSuggestions([{
            id: cleanCep,
            name: `${data.logradouro || 'CEP'} - ${data.bairro || ''}`,
            full_address: `${data.logradouro || ''}, ${data.bairro || ''}, ${data.localidade} - ${data.uf}, ${cleanCep}`,
            isPOI: false,
            coordinates: feature.center as [number, number],
            type: 'cep',
          }]);
          setShowSuggestions(true);
          return true;
        }
      }
      
      // Fallback sem coordenadas
      setSuggestions([{
        id: cleanCep,
        name: `${data.logradouro || 'CEP'} - ${data.bairro || ''}`,
        full_address: `${data.logradouro || ''}, ${data.bairro || ''}, ${data.localidade} - ${data.uf}, ${cleanCep}`,
        isPOI: false,
        type: 'cep',
      }]);
      setShowSuggestions(true);
      return true;
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      return false;
    }
  };

  const searchAddress = async (query: string) => {
    if (!query || query.length < 2 || !mapboxToken) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      // Verificar se é CEP primeiro
      if (isCEP(query)) {
        const found = await searchByCEP(query);
        if (found) {
          setIsLoading(false);
          return;
        }
      }

      const isSearchingPOI = isPOISearch(query);
      
      // Proximity para ordenar resultados, mas sem limitar bbox
      let proximityParam = '';
      if (location.latitude && location.longitude) {
        proximityParam = `&proximity=${location.longitude},${location.latitude}`;
      }

      if (isSearchingPOI) {
        // Usar Search Box API para POIs (shoppings, empresas, etc)
        const response = await fetch(
          `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&access_token=${mapboxToken}&session_token=${sessionTokenRef.current}&language=pt&country=br&limit=6${proximityParam}&types=poi`
        );
        
        const data = await response.json();
        
        if (data.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions.map((s: any) => ({
            id: s.mapbox_id,
            mapbox_id: s.mapbox_id,
            name: s.name,
            full_address: s.full_address || s.place_formatted || s.name,
            isPOI: true,
            type: 'poi',
          })));
          setShowSuggestions(true);
        } else {
          await searchWithGeocoding(query, proximityParam);
        }
      } else {
        await searchWithGeocoding(query, proximityParam);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const searchWithGeocoding = async (query: string, proximityParam: string) => {
    try {
      // IMPORTANTE: Incluir 'place' (cidades), 'region' (estados), 'district' (distritos)
      // Remover bbox para não limitar a busca
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&country=br&language=pt&limit=8${proximityParam}&types=address,poi,neighborhood,locality,place,district,region&autocomplete=true`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const formattedSuggestions = data.features.map((f: any) => {
          const context = f.context || [];
          const neighborhood = context.find((c: any) => c.id?.includes('neighborhood'))?.text || '';
          const locality = context.find((c: any) => c.id?.includes('locality'))?.text || '';
          const city = context.find((c: any) => c.id?.includes('place'))?.text || '';
          const state = context.find((c: any) => c.id?.includes('region'))?.short_code?.replace('BR-', '') || 
                        context.find((c: any) => c.id?.includes('region'))?.text || '';
          
          // Determinar tipo para exibição
          const placeType = f.place_type?.[0] || 'address';
          const isCity = placeType === 'place' || placeType === 'locality';
          const isDistrict = placeType === 'district' || placeType === 'neighborhood';
          
          let name = f.text;
          
          // Adicionar número se for endereço
          if (f.address && placeType === 'address') {
            name += `, ${f.address}`;
          }
          
          // Adicionar bairro se disponível e não for a própria busca
          const bairro = neighborhood || locality;
          if (bairro && !isDistrict && bairro !== f.text) {
            name += ` - ${bairro}`;
          }
          
          // Adicionar cidade se não for a própria cidade sendo buscada
          if (city && !isCity && city !== f.text && city !== bairro) {
            name += `, ${city}`;
          }
          
          // Adicionar estado
          if (state && !f.text.includes(state)) {
            name += ` - ${state}`;
          }
          
          return {
            id: f.id,
            name: name,
            full_address: f.place_name,
            isPOI: placeType === 'poi',
            coordinates: f.center as [number, number],
            type: placeType,
          };
        });
        
        // Ordenar: cidades/lugares primeiro, depois endereços
        formattedSuggestions.sort((a: Suggestion, b: Suggestion) => {
          const typeOrder: Record<string, number> = {
            'place': 0,
            'locality': 1,
            'district': 2,
            'neighborhood': 3,
            'poi': 4,
            'address': 5,
          };
          return (typeOrder[a.type || 'address'] || 5) - (typeOrder[b.type || 'address'] || 5);
        });
        
        setSuggestions(formattedSuggestions);
        setShowSuggestions(true);
      } else {
        // Fallback: busca mais ampla sem restrição de tipos
        const fallbackResponse = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&country=br&language=pt&limit=6&autocomplete=true&fuzzyMatch=true`
        );
        
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData.features && fallbackData.features.length > 0) {
          setSuggestions(fallbackData.features.map((f: any) => {
            const placeType = f.place_type?.[0] || 'address';
            return {
              id: f.id,
              name: f.text,
              full_address: f.place_name,
              isPOI: placeType === 'poi',
              coordinates: f.center as [number, number],
              type: placeType,
            };
          }));
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setSuggestions([]);
    }
  };

  // Buscar coordenadas de POI usando retrieve endpoint
  const retrievePOICoordinates = async (mapboxId: string): Promise<DestinationCoordinates | undefined> => {
    if (!mapboxToken) return undefined;
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}?access_token=${mapboxToken}&session_token=${sessionTokenRef.current}`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const coords = data.features[0].geometry?.coordinates;
        if (coords) {
          return {
            longitude: coords[0],
            latitude: coords[1],
          };
        }
      }
    } catch (error) {
      console.error('Error retrieving POI coordinates:', error);
    }
    return undefined;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue, undefined); // Clear coordinates when typing

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchAddress(newValue);
    }, 300); // Reduzido para resposta mais rápida
  };

  const handleSuggestionClick = async (suggestion: Suggestion) => {
    const displayValue = suggestion.full_address || suggestion.name;
    setInputValue(displayValue);
    setSuggestions([]);
    setShowSuggestions(false);
    
    let coordinates: DestinationCoordinates | undefined;
    
    if (suggestion.isPOI && suggestion.mapbox_id) {
      // Buscar coordenadas do POI
      coordinates = await retrievePOICoordinates(suggestion.mapbox_id);
    } else if (suggestion.coordinates) {
      // Usar coordenadas do geocoding
      coordinates = {
        longitude: suggestion.coordinates[0],
        latitude: suggestion.coordinates[1],
      };
    }
    
    onChange(displayValue, coordinates);
    sessionTokenRef.current = crypto.randomUUID();
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // Ícone baseado no tipo de sugestão
  const getTypeIcon = (suggestion: Suggestion) => {
    if (suggestion.type === 'cep') {
      return <Mail className="w-4 h-4 text-purple-500 shrink-0" />;
    }
    if (suggestion.isPOI || suggestion.type === 'poi') {
      return <Building2 className="w-4 h-4 text-amber-500 shrink-0" />;
    }
    if (suggestion.type === 'place' || suggestion.type === 'locality' || suggestion.type === 'region') {
      return <Search className="w-4 h-4 text-green-500 shrink-0" />;
    }
    return <MapPin className="w-4 h-4 text-blue-500 shrink-0" />;
  };

  // Label do tipo
  const getTypeLabel = (suggestion: Suggestion) => {
    const labels: Record<string, string> = {
      'cep': 'CEP',
      'place': 'Cidade',
      'locality': 'Localidade',
      'district': 'Distrito',
      'neighborhood': 'Bairro',
      'region': 'Estado',
      'poi': 'Local',
      'address': 'Endereço',
    };
    return labels[suggestion.type || 'address'] || 'Local';
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`h-9 text-sm pr-8 ${className}`}
        />
        {isLoading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden max-h-[320px] overflow-y-auto">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <p className="text-xs text-gray-500 font-medium">
              {suggestions.length} resultado(s) encontrado(s)
            </p>
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id || index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
            >
              <div className="mt-0.5">
                {getTypeIcon(suggestion)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {suggestion.name}
                  </p>
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded flex-shrink-0">
                    {getTypeLabel(suggestion)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {suggestion.full_address}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;