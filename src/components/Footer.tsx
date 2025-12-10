import React from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
const Footer: React.FC = () => {
  return <footer className="bg-primary text-primary-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <h3 className="font-display text-2xl font-bold mb-4">GUINCHO FÁCIL 24HS GUINCHO<span className="text-secondary"> GUINCHO</span>
            </h3>
            <p className="text-primary-foreground/70 text-sm mb-6">
              Seu guincho de bolso. Conectamos você ao guincheiro mais próximo em toda região de São Paulo.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-secondary" />
              <span>Atendimento 24 horas</span>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-4">Contato</h4>
            <div className="space-y-3">
              <a href="https://wa.me/5562991429264" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm hover:text-secondary transition-colors">
                <Phone className="w-4 h-4" />
                (62) 99142-9264
              </a>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4" />
                Atendimento em todo o Brasil
              </div>
            </div>
          </div>

          {/* CTA */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-4">Precisa de ajuda?</h4>
            <p className="text-primary-foreground/70 text-sm mb-4">
              Nossos profissionais estão prontos para atender você.
            </p>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto" onClick={() => window.open('https://wa.me/5562991429264', '_blank')}>
              Falar no WhatsApp
            </Button>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/10 text-center">
          <p className="text-primary-foreground/50 text-sm">
            © {new Date().getFullYear()} Achei Guincho. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>;
};
export default Footer;