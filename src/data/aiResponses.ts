// AI simulated responses for common query patterns
export const aiResponses: Record<string, string[]> = {
  'reunión': [
    'Para preparar una reunión con este objetivo, recomiendo los siguientes pasos:\n\n**1. Preparación previa:**\n- Revisar el historial completo de interacciones previas\n- Identificar los temas pendientes de reuniones anteriores\n- Preparar documentación técnica relevante según sus intereses detectados\n\n**2. Protocolo:**\n- Respetar la jerarquía y el trato formal en el saludo\n- Iniciar con tema de cortesía antes de abordar la agenda\n- Preparar obsequio institucional apropiado\n\n**3. Temas sugeridos:**\n- Basándome en sus intereses profesionales, sugiero abordar temas de cooperación técnica\n- Incluir componente cultural que muestre conocimiento de su contexto\n\n**4. Precauciones:**\n- Evitar temas sensibles identificados en el perfil de riesgos\n- No presionar para obtener compromisos inmediatos\n- Mantener tono profesional pero cercano',
  ],
  'confianza': [
    'Basándome en el análisis del perfil, los temas que pueden generar confianza con este objetivo son:\n\n**Intereses compartidos:**\n- Mencionar experiencias o conocimientos sobre sus intereses personales detectados\n- Mostrar genuino interés por la cultura y tradiciones de su país\n\n**Temas profesionales seguros:**\n- Cooperación bilateral en áreas de mutuo beneficio\n- Experiencias de formación internacional\n- Casos de éxito de cooperación con otros países\n\n**Elementos de conexión:**\n- Patrimonio cultural compartido\n- Valores profesionales comunes (disciplina, lealtad, servicio)\n- Intereses académicos o formativos similares\n\n**Recomendaciones:**\n- La confianza se construye gradualmente; priorizar la consistencia sobre la velocidad\n- Cumplir siempre lo prometido, por pequeño que sea\n- Mostrar respeto genuino por su posición y su país',
  ],
  'riesgos': [
    'Los principales riesgos identificados para la relación con este objetivo son:\n\n**Riesgos de comunicación:**\n- Temas sensibles que deben evitarse según el perfil\n- Posibles malentendidos culturales\n- Diferencias en estilos de negociación\n\n**Riesgos operativos:**\n- Competencia con otros actores internacionales\n- Cambios políticos que puedan afectar su posición\n- Filtraciones o vulneración de confidencialidad\n\n**Riesgos de relación:**\n- Sobre-compromiso sin capacidad de cumplimiento\n- Frecuencia de contacto insuficiente\n- Percepción de falta de reciprocidad\n\n**Mitigación recomendada:**\n- Mantener comunicación regular y transparente\n- Verificar la información antes de compartirla\n- Preparar planes de contingencia ante cambios políticos\n- Documentar todas las interacciones sistemáticamente',
  ],
  'intereses': [
    'Según el análisis integral del perfil, los intereses del objetivo se dividen en:\n\n**Intereses personales:**\nBasándome en la información recopilada, el objetivo muestra afinidad por actividades culturales, deportivas y de ocio específicas que están detalladas en su ficha. Estos intereses pueden ser valiosos para establecer conexiones informales.\n\n**Intereses profesionales:**\nEn el ámbito profesional, el objetivo está especialmente interesado en temas de modernización, cooperación internacional y desarrollo de capacidades. Estos intereses representan oportunidades de engagement directo.\n\n**Motivaciones profundas:**\nMás allá de los intereses superficiales, el análisis sugiere que el objetivo está motivado por el reconocimiento profesional, la mejora de la posición de su organización y la construcción de un legado personal.\n\n**Recomendación:**\nUtilizar los intereses personales como herramienta de acercamiento informal y los profesionales como base para propuestas de cooperación formal.',
  ],
  'resumen': [
    'Aquí tiene un resumen consolidado de la información disponible sobre este objetivo:\n\n**Perfil general:**\nEl objetivo es una figura relevante en su ámbito de actuación con influencia significativa en su organización. Su trayectoria profesional y formación internacional lo convierten en un interlocutor valioso.\n\n**Estado de la relación:**\nLa relación se encuentra en una fase de desarrollo con señales positivas. Las interacciones registradas muestran un nivel de receptividad favorable.\n\n**Evaluación de engagement:**\n- Nivel de acceso: Establecido\n- Receptividad: Favorable\n- Potencial de cooperación: Alto\n- Riesgos identificados: Manejables\n\n**Próximas acciones recomendadas:**\n- Mantener la cadencia de contactos establecida\n- Profundizar en áreas de interés mutuo\n- Preparar propuestas concretas de cooperación\n- Documentar y analizar cada nueva interacción\n\n**Conclusión:**\nEl objetivo representa una oportunidad de engagement de alto valor. Se recomienda mantener y reforzar la relación con acciones concretas y medibles.',
  ],
};

export function getAIResponse(query: string, objectiveName: string): string {
  const queryLower = query.toLowerCase();
  
  let responseKey = 'resumen';
  if (queryLower.includes('reunión') || queryLower.includes('reunion') || queryLower.includes('preparar')) {
    responseKey = 'reunión';
  } else if (queryLower.includes('confianza') || queryLower.includes('acercar') || queryLower.includes('tema')) {
    responseKey = 'confianza';
  } else if (queryLower.includes('riesgo') || queryLower.includes('evitar') || queryLower.includes('peligro') || queryLower.includes('alerta')) {
    responseKey = 'riesgos';
  } else if (queryLower.includes('interés') || queryLower.includes('interes') || queryLower.includes('gusta') || queryLower.includes('aficion')) {
    responseKey = 'intereses';
  }

  const responses = aiResponses[responseKey];
  const response = responses[Math.floor(Math.random() * responses.length)];
  
  return response.replace('este objetivo', `**${objectiveName}**`);
}
