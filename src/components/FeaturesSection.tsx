import React from 'react';
import { 
  Clock, 
  DollarSign, 
  Shield, 
  MapPin, 
  Headphones, 
  Smartphone,
  LucideIcon
} from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Clock,
    title: 'Agilidade no Atendimento',
    description: 'Conectamos você ao guincheiro mais próximo em poucos minutos, garantindo uma resposta ágil para resolver imprevistos.',
  },
  {
    icon: DollarSign,
    title: 'Previsão de Preço',
    description: 'Receba uma estimativa do valor do serviço diretamente, sem surpresas e com total transparência.',
  },
  {
    icon: Shield,
    title: 'Segurança Garantida',
    description: 'Trabalhamos apenas com profissionais verificados e capacitados, trazendo segurança e confiança.',
  },
  {
    icon: MapPin,
    title: 'Acompanhamento em Tempo Real',
    description: 'Monitore o percurso do guincho em tempo real, desde o deslocamento até o local do atendimento.',
  },
  {
    icon: Headphones,
    title: 'Disponível 24 Horas',
    description: 'Nossa plataforma funciona a qualquer hora do dia, para garantir que você nunca fique desamparado.',
  },
  {
    icon: Smartphone,
    title: 'Conveniência e Facilidade',
    description: 'Com apenas alguns toques, você pode solicitar um guincho, sem precisar procurar números ou aguardar.',
  },
];

const FeaturesSection: React.FC = () => {
  return (
    <section className="py-20 bg-background" id="recursos">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-secondary/10 text-secondary rounded-full text-sm font-semibold mb-4">
            Recursos
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Todos os recursos que você precisa
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Pensamos em cada detalhe para oferecer a melhor experiência quando você mais precisa
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-6 bg-card rounded-2xl border border-border card-elevated card-hover"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
