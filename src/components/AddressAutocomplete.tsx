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
  place_name: string;
  text: string;
  address: string;
  category: string;
}

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

  const searchAddress = async (query: string) => {
    if (!query || query.length < 2 || !mapboxToken) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      // Use proximity to user's location for better results
      const proximity = location.latitude && location.longitude 
        ? `&proximity=${location.longitude},${location.latitude}` 
        : '';
      
      // Include POI first for places like shopping centers, then other types
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&country=br&language=pt&limit=6${proximity}&types=poi,address,place,locality,neighborhood`
      );
      
      const data = await response.json();
      
      if (data.features) {
        setSuggestions(data.features.map((f: any) => ({
          id: f.id,
          place_name: f.place_name,
          text: f.text,
          address: f.properties?.address || '',
          category: f.properties?.category || '',
        })));
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchAddress(newValue);
    }, 300);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setInputValue(suggestion.place_name);
    onChange(suggestion.place_name);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const isPOI = (suggestion: Suggestion) => {
    return suggestion.id.startsWith('poi');
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
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
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full flex items-start gap-2 px-3 py-2.5 hover:bg-muted transition-colors text-left border-b border-border/50 last:border-b-0"
            >
              {isPOI(suggestion) ? (
                <Building2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
              ) : (
                <MapPin className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">
                  {suggestion.text}
                </p>
                <p className="text-[10px] text-muted-foreground line-clamp-2">
                  {suggestion.place_name}
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
