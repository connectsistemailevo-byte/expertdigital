import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2, Building2 } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface Suggestion {
  id: string;
  name: string;
  full_address: string;
  isPOI: boolean;
}

// Palavras que indicam busca por POI/estabelecimento
const POI_KEYWORDS = [
  'shopping', 'mall', 'mercado', 'supermercado', 'hospital', 
  'hotel', 'restaurante', 'farmacia', 'farmácia', 'posto', 'banco',
  'escola', 'faculdade', 'universidade', 'igreja', 'academia',
  'oficina', 'concessionaria', 'concessionária', 'loja', 'centro comercial',
  'aeroporto', 'rodoviária', 'rodoviaria', 'terminal'
];

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Digite o endereço",
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

  const searchAddress = async (query: string) => {
    if (!query || query.length < 3 || !mapboxToken) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      const isSearchingPOI = isPOISearch(query);
      
      // Bounding box centrado na localização do usuário (raio de ~50km)
      // Isso força os resultados a serem da região
      let bboxParam = '';
      let proximityParam = '';
      
      if (location.latitude && location.longitude) {
        // Bbox de aproximadamente 100km ao redor do usuário
        const delta = 0.9; // ~100km
        bboxParam = `&bbox=${location.longitude - delta},${location.latitude - delta},${location.longitude + delta},${location.latitude + delta}`;
        proximityParam = `&proximity=${location.longitude},${location.latitude}`;
      }

      if (isSearchingPOI) {
        // Usar Search Box API para POIs (shoppings, empresas, etc)
        const response = await fetch(
          `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&access_token=${mapboxToken}&session_token=${sessionTokenRef.current}&language=pt&country=br&limit=5${proximityParam}&types=poi`
        );
        
        const data = await response.json();
        
        if (data.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions.map((s: any) => ({
            id: s.mapbox_id,
            name: s.name,
            full_address: s.full_address || s.place_formatted || s.name,
            isPOI: true,
          })));
          setShowSuggestions(true);
        } else {
          await searchWithGeocoding(query, bboxParam, proximityParam);
        }
      } else {
        await searchWithGeocoding(query, bboxParam, proximityParam);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const searchWithGeocoding = async (query: string, bboxParam: string, proximityParam: string) => {
    try {
      // Usar bbox para restringir resultados à região + proximity para ordenar
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&country=br&language=pt&limit=5${bboxParam}${proximityParam}&types=address,neighborhood,locality,place&autocomplete=true`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        setSuggestions(data.features.map((f: any) => ({
          id: f.id,
          name: f.text + (f.address ? `, ${f.address}` : ''),
          full_address: f.place_name,
          isPOI: false,
        })));
        setShowSuggestions(true);
      } else {
        // Se não encontrar com bbox, tenta sem bbox mas com proximity
        const fallbackResponse = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&country=br&language=pt&limit=5${proximityParam}&types=address,neighborhood,locality,place&autocomplete=true`
        );
        
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData.features && fallbackData.features.length > 0) {
          setSuggestions(fallbackData.features.map((f: any) => ({
            id: f.id,
            name: f.text + (f.address ? `, ${f.address}` : ''),
            full_address: f.place_name,
            isPOI: false,
          })));
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchAddress(newValue);
    }, 400);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    const displayValue = suggestion.full_address || suggestion.name;
    setInputValue(displayValue);
    onChange(displayValue);
    setSuggestions([]);
    setShowSuggestions(false);
    sessionTokenRef.current = crypto.randomUUID();
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
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
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden max-h-[200px] overflow-y-auto">
          <div className="px-3 py-1.5 bg-muted/50 border-b border-border">
            <p className="text-[10px] text-muted-foreground">
              Selecione ou continue digitando
            </p>
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id || index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full flex items-start gap-2 px-3 py-2 hover:bg-muted transition-colors text-left border-b border-border/30 last:border-b-0"
            >
              {suggestion.isPOI ? (
                <Building2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
              ) : (
                <MapPin className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">
                  {suggestion.name}
                </p>
                <p className="text-[10px] text-muted-foreground line-clamp-2">
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
