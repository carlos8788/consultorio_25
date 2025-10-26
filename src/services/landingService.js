const landingContent = {
  hero: {
    image: '/img/health/showcase-1.webp',
    imageAlt: 'Profesionales de la salud utilizando el CRM',
    badge: 'CRM médico en la nube',
    title: 'Gestioná tu consultorio con una sola plataforma',
    description: 'Centralizá pacientes, turnos, facturación y reportes en un mismo lugar con flujos diseñados para equipos médicos.',
    ctas: [
      { label: 'Solicitar demo', href: '#modulos', variant: 'primary' },
      { label: 'Iniciar sesión', href: '/login', variant: 'outline' }
    ],
    infoBadges: [
      { icon: 'bi bi-headset', label: 'Soporte dedicado', value: '7x24' },
      { icon: 'bi bi-shield-lock', label: 'Seguridad de datos', value: 'Cifrado AES-256' }
    ],
    featureCards: [
      { icon: 'bi bi-calendar2-check-fill', title: 'Agenda inteligente', text: 'Sincronizá salas, profesionales y recordatorios automáticos.', delay: 450 },
      { icon: 'bi bi-people-fill', title: 'Portal de pacientes', text: 'Autogestión, historiales y comunicación bidireccional.', delay: 500 },
      { icon: 'bi bi-graph-up-arrow', title: 'Reportes vivos', text: 'Indicadores clínicos y financieros en tiempo real.', delay: 550 }
    ]
  },
  plataforma: {
    image: '/img/health/facilities-1.webp',
    imageAlt: 'Equipo administrativo gestionando pacientes',
    badge: { years: '10+', text: 'Años optimizando consultorios' },
    title: 'Una plataforma centrada en la experiencia médica',
    lead: 'Automatizá tareas repetitivas y brindá seguimiento personalizado a cada paciente.',
    description: 'Configura permisos por rol, conectá múltiples sedes y obtené trazabilidad completa de cada interacción clínica y administrativa.',
    features: [
      { icon: 'bi bi-cpu', title: 'Automatización clínica', text: 'Workflows configurables para derivaciones, autorizaciones y recordatorios.', delay: 400 },
      { icon: 'bi bi-cloud-arrow-down', title: 'Disponibilidad garantizada', text: 'Infraestructura redundante y copias de seguridad diarias.', delay: 500 }
    ],
    ctas: [
      { href: '#flujo', className: 'btn-primary', label: 'Ver procesos' },
      { href: '#cta', className: 'btn-outline', label: 'Contactar al equipo' }
    ],
    logos: {
      title: 'Equipos que confían en nuestra solución',
      items: [
        { src: '/img/clients/clients-1.webp', alt: 'Clínica Norte', delay: 700 },
        { src: '/img/clients/clients-2.webp', alt: 'Salud Integral', delay: 800 },
        { src: '/img/clients/clients-3.webp', alt: 'Centro Respira', delay: 900 },
        { src: '/img/clients/clients-4.webp', alt: 'Red Acompaña', delay: 1000 }
      ]
    }
  },
  modulos: {
    title: 'Módulos principales',
    subtitle: 'Todo el ciclo de atención en un mismo CRM médico.',
    items: [
      {
        icon: 'fas fa-user-injured',
        title: 'Pacientes y obras sociales',
        description: 'Historial clínico, autorizaciones y datos administrativos siempre actualizados.',
        features: [
          'Búsqueda avanzada por DNI, cobertura o diagnósticos',
          'Alertas de vencimientos y padrones',
          'Documentos y estudios adjuntos'
        ],
        cta: { href: '/login', label: 'Ver módulo' },
        delay: 200
      },
      {
        icon: 'fas fa-calendar-alt',
        title: 'Agenda y turnos',
        description: 'Bloques configurables por profesional, sala o equipo médico.',
        features: [
          'Recordatorios automáticos por WhatsApp/email',
          'Listas de espera inteligentes',
          'Integración con calendario personal'
        ],
        cta: { href: '/login', label: 'Planificar agenda' },
        delay: 300
      },
      {
        icon: 'fas fa-file-invoice-dollar',
        title: 'Facturación y cobranzas',
        description: 'Conciliación en segundos y seguimiento de convenios.',
        features: [
          'Liquidaciones automáticas',
          'Reportes por obra social',
          'Alertas de cobranzas pendientes'
        ],
        cta: { href: '/login', label: 'Controlar ingresos' },
        delay: 400
      },
      {
        icon: 'fas fa-chart-line',
        title: 'Indicadores y BI',
        description: 'Paneles accionables para dirección médica y administrativa.',
        features: [
          'KPIs clínicos y operativos',
          'Comparativas entre sedes',
          'Exportación a Excel y DataStudio'
        ],
        cta: { href: '/login', label: 'Explorar analíticas' },
        delay: 500
      }
    ]
  },
  flujo: {
    title: 'Un flujo continuo desde la primera consulta hasta el seguimiento',
    description: 'Configura etapas, asigna responsables y dispara automatizaciones sin código.',
    ctas: [
      { href: '/login', className: 'btn-primary', label: 'Ingresar al CRM' },
      { href: '#cta', className: 'btn-secondary', label: 'Hablar con ventas' }
    ],
    features: [
      {
        icon: 'bi bi-kanban',
        title: 'Pipeline de turnos',
        text: 'Visualizá el estado de cada cita, reprogramaciones y ausencias.',
        href: '#modulos',
        linkLabel: 'Ver agenda'
      },
      {
        icon: 'bi bi-bell-fill',
        title: 'Alertas inteligentes',
        text: 'Notificaciones para estudios pendientes, tratamientos y controles.',
        href: '#plataforma',
        linkLabel: 'Revisar flujos'
      },
      {
        icon: 'bi bi-people',
        title: 'Trabajo colaborativo',
        text: 'Roles y permisos para médicos, administración y dirección.',
        href: '/login',
        linkLabel: 'Asignar equipos'
      }
    ],
    alert: {
      icon: 'bi bi-chat-dots-fill',
      title: '¿Necesitás acompañamiento?',
      text: 'Nuestro equipo de onboarding responde en menos de 5 minutos hábiles.',
      href: '#cta',
      cta: 'Contactar al equipo'
    }
  },
  cta: {
    title: 'Implementá el CRM de consultorio en tu organización',
    subtitle: 'Coordinamos capacitación, migración histórica y soporte continuo.',
    card: {
      icon: 'bi bi-envelope-check-fill',
      title: 'Coordiná una demo privada',
      text: 'Elegí la fecha que más te convenga y revisemos juntos los módulos que necesitás.',
      actions: [
        { href: '/login', icon: 'bi bi-box-arrow-in-right', label: 'Iniciar sesión', className: 'btn-emergency' },
        { href: 'mailto:ventas@consultorio.com', icon: 'bi bi-envelope', label: 'Escribir a ventas', className: 'btn-contact' }
      ]
    }
  }
};

export const getLandingContent = () => landingContent;

export default getLandingContent;
