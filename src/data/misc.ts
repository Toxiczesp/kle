import type { DocumentItem, PersonalityAnalysis, ReportTemplate, Project } from '../types';

export const mockDocuments: DocumentItem[] = [
  { id: 'doc-001', objectiveId: 'obj-001', name: 'Perfil biográfico inicial', type: 'document', description: 'Ficha biográfica elaborada por inteligencia de fuentes abiertas.', dateUploaded: '2025-11-20', size: '2.4 MB', category: 'Biografía' },
  { id: 'doc-002', objectiveId: 'obj-001', name: 'Cuestionario Observador - Nov 2025', type: 'questionnaire', description: 'Cuestionario completado por el agregado de defensa tras primera toma de contacto.', dateUploaded: '2025-11-28', size: '340 KB', category: 'Evaluación' },
  { id: 'doc-003', objectiveId: 'obj-001', name: 'Informe de interacción - Marzo 2026', type: 'report', description: 'Informe formal de la reunión en base militar de Al-Khadir.', dateUploaded: '2026-03-12', size: '1.1 MB', category: 'Informes' },
  { id: 'doc-004', objectiveId: 'obj-001', name: 'Notas del analista - Preparación reunión', type: 'note', description: 'Notas preparatorias para la reunión de mayo 2026.', dateUploaded: '2026-05-10', size: '120 KB', category: 'Notas' },
  { id: 'doc-005', objectiveId: 'obj-002', name: 'Perfil diplomático', type: 'document', description: 'Perfil de la ministra elaborado por la embajada.', dateUploaded: '2025-12-05', size: '1.8 MB', category: 'Biografía' },
  { id: 'doc-006', objectiveId: 'obj-002', name: 'Discurso ONU - Derechos de la mujer', type: 'file', description: 'Transcripción del discurso de la ministra en la Asamblea General.', dateUploaded: '2026-01-15', size: '580 KB', category: 'Documentos públicos' },
  { id: 'doc-007', objectiveId: 'obj-003', name: 'Evaluación preliminar', type: 'evaluation', description: 'Evaluación del perfil y potencial de cooperación.', dateUploaded: '2026-03-01', size: '890 KB', category: 'Evaluación' },
  { id: 'doc-008', objectiveId: 'obj-003', name: 'Organigrama del Ministerio del Interior', type: 'document', description: 'Estructura organizativa del ministerio con posiciones clave marcadas.', dateUploaded: '2026-02-25', size: '1.5 MB', category: 'Organigramas' },
  { id: 'doc-009', objectiveId: 'obj-004', name: 'CV militar desclasificado', type: 'document', description: 'Currículum militar obtenido de fuentes públicas moldanas.', dateUploaded: '2025-10-10', size: '750 KB', category: 'Biografía' },
  { id: 'doc-010', objectiveId: 'obj-005', name: 'Red de contactos empresariales', type: 'document', description: 'Mapa de relaciones empresariales del Sheikh.', dateUploaded: '2026-01-20', size: '3.2 MB', category: 'Análisis' },
  { id: 'doc-011', objectiveId: 'obj-005', name: 'Informe de due diligence', type: 'report', description: 'Verificación de antecedentes financieros y empresariales.', dateUploaded: '2026-03-15', size: '4.1 MB', category: 'Informes' },
  { id: 'doc-012', objectiveId: 'obj-006', name: 'Perfil archivado', type: 'document', description: 'Perfil completo archivado tras cierre del caso.', dateUploaded: '2026-03-25', size: '2.0 MB', category: 'Archivo' },
];

export const mockAnalyses: Record<string, PersonalityAnalysis> = {
  'obj-001': {
    objectiveId: 'obj-001',
    executiveSummary:
      'El General Al-Rashidi es un líder militar pragmático con fuerte inclinación hacia la cooperación internacional. Su formación francesa le otorga una perspectiva occidental que facilita la interlocución. Es un negociador experimentado que valora la reciprocidad y el respeto institucional. Representa la mejor vía de entrada para la cooperación en defensa con Maravia.',
    personalityProfile:
      'Perfil de personalidad DISC estimado: Dominancia Alta / Influencia Media. Es un líder directo, orientado a resultados, que toma decisiones rápidas pero valora la información de calidad. Muestra rasgos de estilo analítico cuando se trata de acuerdos formales. En entornos informales, revela un lado más reflexivo y cultural. Prefiere jerarquía clara y protocolo en reuniones formales, pero puede ser accesible en formatos más relajados.',
    socioculturalInterests:
      'Profundo conocimiento y aprecio por la cultura árabe clásica, especialmente la poesía y la historia militar. Su estancia en Francia le generó una conexión con la cultura francófona. Muestra interés en la historia militar española, particularmente la presencia española en el norte de África. Es un jinete experimentado y participa en competiciones ecuestres regionales.',
    motivations:
      'Su principal motivación profesional es la modernización de las fuerzas armadas de Maravia y el reconocimiento internacional de su país como socio de seguridad fiable. A nivel personal, busca asegurar el legado de su carrera militar con logros diplomáticos tangibles. Valora la lealtad y las relaciones a largo plazo por encima de resultados inmediatos.',
    connectionPoints:
      'Historia militar compartida entre España y el Magreb. Programa de formación de la academia militar española. Industria de defensa española (vehículos blindados, comunicaciones). Intereses ecuestres (Real Club de Polo, rejoneadores). Patrimonio cultural hispano-árabe. Gastronomía (muestra curiosidad por la cocina española).',
    communicationRisks:
      'Evitar referencias directas a conflictos internos de Maravia. No adoptar un tono condescendiente ni paternalista. No comparar negativamente con la oferta francesa. Ser cauteloso con temas de derechos humanos, que pueden ser percibidos como injerencia. No presionar para obtener compromisos en primera reunión.',
    recommendations:
      'Mantener frecuencia de contacto regular (mínimo trimestral). Invitar a España para actividades militares y culturales. Preparar demostración técnica de sistemas de defensa españoles. Facilitar encuentro con homólogos españoles de rango equivalente. Incluir componente cultural en todas las interacciones (visitas a museos militares, patrimonio andalusí). Considerar invitación a corrida de rejones o exhibición ecuestre.',
  },
  'obj-002': {
    objectiveId: 'obj-002',
    executiveSummary:
      'La Dra. Benkhouya es una diplomática sofisticada y reformista, con fuerte orientación hacia los derechos de la mujer y la cooperación al desarrollo. Su formación europea y su experiencia diplomática la convierten en una interlocutora ideal para España. Tiene influencia real en el gobierno civil de Maravia y puede facilitar acuerdos en áreas no militares.',
    personalityProfile:
      'Perfil estimado: alta consciencia (metódica) con influencia social media-alta. Es diplomática, articulada y cuidadosa con las formas. Prefiere la planificación y los procesos formales. En privado es más directa y expresiva. Muestra empatía genuina y compromiso ideológico con la igualdad de género. Toma decisiones de forma deliberada, consultando a su equipo.',
    socioculturalInterests:
      'Apasionada de la literatura francesa y la música clásica. Lectora voraz de autores del Magreb en francés. Disfruta la cocina mediterránea y ha expresado admiración por la gastronomía española. Practica senderismo cuando viaja a Europa. Colecciona cerámica artesanal de distintos países.',
    motivations:
      'Su motivación principal es dejar un legado de modernización institucional y avance en derechos de la mujer en Maravia. Busca aliados internacionales que respalden su agenda reformista sin comprometer la soberanía de su país. Profesionalmente, aspira a posiciones más altas en organizaciones internacionales tras su carrera ministerial.',
    connectionPoints:
      'Programas de cooperación al desarrollo (AECID). Intercambios académicos y becas. Modelos españoles de igualdad de género. Patrimonio cultural compartido mediterráneo. Gastronomía española. Eventos culturales en España (festivales, exposiciones).',
    communicationRisks:
      'No mezclar temas de defensa con cooperación civil en la misma conversación. Evitar actitud de «donante» o superioridad. Respetar estrictamente el protocolo en contextos públicos. No forzar posicionamientos políticos públicos. Ser sensible a la complejidad de su posición como mujer ministra en Maravia.',
    recommendations:
      'Invitar a foros y conferencias sobre cooperación al desarrollo en España. Facilitar contacto con la Secretaría de Estado de Igualdad. Proponer programa de becas específico para mujeres maravianas. Organizar cena privada con personalidades españolas afines. Mantener canal de comunicación fluido y respetar sus tiempos.',
  },
  'obj-003': {
    objectiveId: 'obj-003',
    executiveSummary:
      'Ibrahim Diouf es un profesional de la seguridad en ascenso con apertura a la cooperación internacional. Su nombramiento reciente y su perfil técnico representan una oportunidad para establecer una relación temprana. Su vinculación con los servicios franceses es un factor a considerar, pero no un obstáculo. Requiere un proceso de cultivo gradual y basado en resultados concretos.',
    personalityProfile:
      'Perfil estimado: pragmático y orientado a resultados. Estilo directo, sin muchas florituras diplomáticas. Valora la competencia técnica por encima de la retórica. Es analítico y reservado en el primer contacto, pero se abre cuando percibe profesionalismo. No es especialmente jerárquico en el trato personal.',
    socioculturalInterests:
      'Gran aficionado al fútbol (sigue la Liga española). Disfruta de la pesca deportiva, actividad que practicaba en su juventud en el río Senegal. Cinéfilo con preferencia por el cine francés y africano. Interesado en la historia precolonial de África Occidental.',
    motivations:
      'Consolidar su posición como Director de Seguridad Interior mediante resultados visibles. Diversificar las alianzas internacionales de Senara más allá de Francia. Modernizar los sistemas de seguridad con tecnología avanzada. Ganar reconocimiento profesional en foros internacionales.',
    connectionPoints:
      'Fútbol español (posible invitación a partido de la selección o club). Programas de formación de la Guardia Civil. Tecnología española de control fronterizo. Cooperación en ciberseguridad. Visita a centros de formación policial en España.',
    communicationRisks:
      'No parecer competidores directos de Francia; posicionarse como complementarios. No subestimar la capacidad técnica de los servicios senareños. Evitar promesas que no se puedan cumplir a corto plazo. Cuidar la confidencialidad absoluta de los contactos.',
    recommendations:
      'Organizar visita técnica a la Guardia Civil en 2026. Invitar a curso de formación en España. Enviar delegación técnica a Senara con demostración de capacidades. Usar el fútbol como herramienta de acercamiento informal. Proponer acuerdo marco de cooperación policial. Mantener frecuencia de contacto mensual por videoconferencia.',
  },
};

export const mockReportTemplates: ReportTemplate[] = [
  {
    id: 'rpt-summary',
    name: 'Informe Resumen',
    description: 'Resumen ejecutivo del perfil del objetivo con información esencial.',
    icon: 'FileText',
    sections: ['Datos básicos', 'Resumen ejecutivo', 'Estado actual', 'Prioridad y recomendaciones'],
  },
  {
    id: 'rpt-complete',
    name: 'Informe Completo',
    description: 'Perfil integral del objetivo con todas las dimensiones de análisis.',
    icon: 'FileStack',
    sections: ['Datos biográficos', 'Perfil de personalidad', 'Historial de interacciones', 'Análisis completo', 'Documentos asociados', 'Recomendaciones'],
  },
  {
    id: 'rpt-sociocultural',
    name: 'Informe de Intereses Socioculturales',
    description: 'Análisis detallado de intereses, afinidades y contexto cultural.',
    icon: 'Globe',
    sections: ['Intereses personales', 'Intereses profesionales', 'Contexto sociocultural', 'Puntos de conexión', 'Recomendaciones culturales'],
  },
  {
    id: 'rpt-interaction',
    name: 'Informe de Evaluación de Interacción',
    description: 'Evaluación detallada de una interacción específica con el objetivo.',
    icon: 'MessageSquare',
    sections: ['Datos de la interacción', 'Temas tratados', 'Evaluación de actitud', 'Intereses detectados', 'Riesgos', 'Próximos pasos'],
  },
  {
    id: 'rpt-consolidated',
    name: 'Informe Final Consolidado',
    description: 'Informe integral que consolida toda la información disponible del objetivo.',
    icon: 'BookOpen',
    sections: ['Resumen ejecutivo', 'Perfil completo', 'Historial de interacciones', 'Análisis de personalidad', 'Intereses socioculturales', 'Evaluación de riesgos', 'Recomendaciones finales', 'Anexos'],
  },
];

export const mockProjects: Array<Project> = [
  { id: 'proj-001', name: 'Operación Puente Diplomático', description: 'Establecimiento de relaciones bilaterales de defensa con Maravia.', status: 'active', objectiveCount: 2 },
  { id: 'proj-002', name: 'Proyecto Atlas', description: 'Red de cooperación en seguridad interior con países de África Occidental.', status: 'active', objectiveCount: 2 },
  { id: 'proj-003', name: 'Proyecto Escudo Oriental', description: 'Seguimiento de agregados militares de Europa del Este.', status: 'active', objectiveCount: 1 },
  { id: 'proj-004', name: 'Proyecto Horizonte Azul', description: 'Relaciones con líderes empresariales y gubernamentales del Golfo.', status: 'active', objectiveCount: 1 },
];
