import React, { useEffect } from 'react';

const manualHtml = `
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manual de Usuario - SIBAP</title>
    <style>
        :root {
            --primary: #1a5276;
            --primary-light: #e9f5f8;
            --text-dark: #102129;
            --text-gray: #475569;
            --border: #e2e8f0;
            --bg-screen: #cbd5e1;
            --white: #ffffff;
        }

        /* Tamaño y Márgenes (@page) */
        @page {
            size: letter;
            margin: 1in;
        }

        /* Contención y Tipografía General */
        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        html,
        body {
            margin: 0;
            padding: 0;
            width: 100%;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: var(--text-gray);
            background-color: var(--bg-screen);
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        /* Estenedor de página para visualización en pantalla */
        .page {
            width: 8.5in;
            min-height: 11in;
            background: var(--white);
            padding: 1in;
            margin: 20px 0;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            position: relative;
            /* Paginación */
            page-break-after: always;
            break-after: page;
            /* Contención del Contenido */
            overflow-wrap: break-word;
            word-wrap: break-word;
            word-break: normal;
        }

        .page:last-child {
            page-break-after: auto;
            break-after: auto;
            margin-bottom: 40px;
        }

        img,
        table,
        pre,
        code {
            max-width: 100% !important;
            height: auto;
            overflow-wrap: break-word;
        }

        p,
        li,
        .note,
        img,
        h3 {
            page-break-inside: avoid;
            break-inside: avoid;
        }

        h1,
        h2,
        h3 {
            page-break-after: avoid;
            break-after: avoid;
        }

        .header {
            text-align: center;
            border-bottom: 2px solid var(--border);
            padding-bottom: 30px;
            margin-bottom: 40px;
        }

        .header h1 {
            color: var(--primary);
            font-size: 2.5rem;
            margin-bottom: 10px;
            margin-top: 0;
            text-align: center;
        }

        .header p {
            font-size: 1.2rem;
            color: var(--text-gray);
            margin: 5px 0;
            text-align: center;
        }

        h2 {
            color: var(--text-dark);
            border-bottom: 1px solid var(--border);
            padding-bottom: 8px;
            margin-top: 25px;
            font-size: 1.5rem;
        }

        h3 {
            color: var(--primary);
            margin-top: 20px;
            font-size: 1.2rem;
        }

        p {
            margin-bottom: 12px;
            text-align: justify;
        }

        ul,
        ol {
            margin-bottom: 15px;
            padding-left: 25px;
        }

        li {
            margin-bottom: 8px;
        }

        .note {
            background-color: var(--primary-light);
            border-left: 5px solid var(--primary);
            padding: 15px 20px;
            border-radius: 0 8px 8px 0;
            margin: 20px 0;
            color: var(--primary);
            font-weight: 500;
        }

        .page-number {
            position: absolute;
            bottom: 0.5in;
            right: 1in;
            font-size: 0.9rem;
            color: #94a3b8;
        }

        footer {
            position: absolute;
            bottom: 0.5in;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 0.9rem;
            color: #94a3b8;
        }

        /* Estilos de Impresión (@media print) */
        @media print {
            body {
                background-color: transparent !important;
                padding: 0 !important;
                margin: 0 !important;
                display: block !important;
            }

            .page {
                box-shadow: none !important;
                margin: 0 !important;
                padding: 0 !important;
                /* El margen real lo da @page margin: 1in */
                width: 100% !important;
                height: auto !important;
                min-height: auto !important;
                page-break-after: always !important;
                break-after: page !important;
            }

            .page:last-child {
                page-break-after: auto !important;
                break-after: auto !important;
            }

            .page-number,
            footer {
                bottom: 0 !important;
                position: absolute;
            }

            /* Eliminar elementos innecesarios en papel (si hubiera botones) */
            .no-print {
                display: none !important;
            }
        }
    </style>
</head>

<body>

    <!-- PÁGINA 1 -->
    <div class="page">
        <div class="header">
            <h1>Manual de Usuario SIBAP</h1>
            <p>Sistema Inteligente de Bancos de Preguntas</p>
            <p><small>Versión 1.0 - Plataforma Docente</small></p>
        </div>

        <h2>1. Introducción</h2>
        <p>SIBAP es una plataforma para la generación de reactivos de evaluación mediante el uso de 
            <strong>Inteligencia Artificial Generativa</strong>. El sistema utiliza una base de conocimiento 
            específica basada en los documentos que el usuario proporciona.</p>
        <p>Las preguntas se obtienen a partir de los materiales (libros, apuntes o presentaciones) subidos al sistema, 
            lo que permite que la evaluación sea consistente con el contenido académico registrado.</p>

        <h2>2. Acceso al Sistema</h2>
        <p>El acceso se realiza mediante las siguientes etapas:</p>
        <ol>
            <li>Ingreso con sus credenciales (correo electrónico y contraseña) en la pantalla de inicio.</li>
            <li>En caso de no contar con una cuenta, el proceso de <strong>Registro</strong> permite crear un perfil 
                donde se almacenan los bancos de preguntas de manera individual.</li>
        </ol>
        <div class="note">
            Para el registro es importante que la contraseña sea mayor o igual a 8 caracteres, incluya mayúsculas, minúsculas y caracteres especiales.
        </div>
        <div class="note">
            Si extravías el acceso a tu cuenta, el sistema permite la recuperación de contraseña mediante un enlace enviado al correo electrónico registrado.
        </div>

        <div class="page-number">1</div>
    </div>

    <!-- PÁGINA 2 -->
    <div class="page">
        <h2>3. Navegación Principal</h2>
        <p>El menú lateral permite acceder a los distintos módulos del sistema:</p>
        <ul>
            <li><strong>Dashboard:</strong> Resumen de la actividad reciente y estadísticas generales de uso.</li>
            <li><strong>Nuevo Banco:</strong> Asistente para la configuración y generación de nuevos reactivos.</li>
            <li><strong>Mis Bancos:</strong> Repositorio de bancos generados anteriormente para consulta, edición o 
                exportación.</li>
            <li><strong>Mis Documentos:</strong> Sección para la carga y gestión de los archivos que sirven como 
                base de conocimiento para la IA.</li>
            <li><strong>Mi Perfil:</strong> En esta sección el usuario puede cambiar su contraseña, su información personal o eliminar su cuenta.</li>
        </ul>

        <h2>4. Gestión de Documentos</h2>
        <p>La precisión de la generación depende de la calidad y el estado de los archivos proporcionados.</p>
        <h3>Carga y Procesamiento</h3>
        <ol>
            <li>En <strong>Mis Documentos</strong>, se pueden cargar archivos en formato PDF, TXT, DOCX o PPTX.</li>
            <li>El sistema realiza un proceso de <strong>Indexación</strong> para habilitar la búsqueda semántica 
                sobre el contenido.</li>
            <li>Es necesario que el estado del archivo figure como <strong>"Completado"</strong> para que pueda 
                ser utilizado en la generación de reactivos.</li>
        </ol>
        <div class="note">
            Nota: Se recomienda utilizar documentos con texto legible. El motor de extracción de datos requiere que 
            la información esté ordenada para realizar una identificación correcta de los conceptos.
        </div>

        <h2>5. Generación de Bancos de Preguntas</h2>
        <p>El proceso de creación se divide en tres etapas de configuración:</p>

        <h3>Etapa 1: Carga de insumos</h3>
        <p>Se seleccionan los documentos de la biblioteca que servirán como contexto para la evaluación. Es posible 
            combinar varios archivos (máximo 10) para una misma sesión de generación.</p>

        <div class="note">
            Si un documento fue cargado recientemente, verifique en <strong>Mis Documentos</strong> que el proceso 
            de indexación haya finalizado antes de iniciar la generación.
        </div>

        <div class="page-number">2</div>
    </div>

    <!-- PÁGINA 3 -->
    <div class="page">
        <h3>Etapa 2: Parámetros Académicos</h3>
        <p>En esta etapa se define el marco educativo de la evaluación. El sistema utiliza esta información para 
            contextualizar la generación de reactivos:</p>
        <ul>
            <li><strong>Identificación Curricular:</strong> Selección del Programa Educativo, Semestre y Asignatura. 
                Es posible seleccionar datos del catálogo existente o realizar una carga manual si la asignatura 
                no se encuentra en la lista.</li>
            <li><strong>Tema y Subtema:</strong> Delimitación específica del contenido a evaluar. Definir un subtema 
                ayuda a la IA a enfocarse en una sección particular del documento. Es importante proporcionar esta información
                para que la indexación semántica sea precisa.</li>
            <li><strong>Niveles Cognitivos:</strong> Selección de uno o más niveles de la Taxonomía de Bloom 
                (Recordar, Comprender, Aplicar, Analizar, Evaluar, Crear) para determinar la profundidad de 
                razonamiento requerida.</li>
            <li><strong>Estructura del Banco:</strong> Configuración de la cantidad de preguntas por tipo:
                <ul>
                    <li><em>Opción Múltiple:</em> Permite definir el número de distractores por pregunta.</li>
                    <li><em>Relacionar Columnas:</em> Genera pares de conceptos relacionados.</li>
                    <li><em>Calculada:</em> Enfocada en problemas numéricos y fórmulas.</li>
                </ul>
            </li>
            <li><strong>Configuración Pedagógica Avanzada:</strong> Espacio opcional para añadir resultados de 
                aprendizaje, competencias (generales y específicas) e instrucciones especiales sobre el tono o 
                estilo de los reactivos.</li>
        </ul>

        <h3>Etapa 3: Configuración de la IA</h3>
        <p>Ajustes finales sobre el motor de procesamiento y la precisión de búsqueda:</p>
        <ul>
            <li><strong>Modelo de IA:</strong> Selección entre diferentes motores de procesamiento (ej. Gemini) 
                según la complejidad requerida.</li>
            <li><strong>Conceptos a Evaluar (Keywords):</strong> Ingreso de términos técnicos que sirven para 
                mejorar la precisión de la búsqueda semántica. Estas palabras guían al sistema para localizar los 
                mejores fragmentos de información dentro de los documentos.</li>
            <li><strong>Retroalimentación:</strong> Opción para activar la generación automática de justificaciones 
                generales o específicas por cada opción de respuesta.</li>
        </ul>

        <h2>6. Proceso de Validación</h2>
        <p>Una vez generados los reactivos, el docente debe realizar una revisión técnica antes de guardar el banco:</p>
        <ul>
            <li><strong>Revisión de Contenido:</strong> Verificación de la pregunta y la respuesta correcta sugerida.</li>
            <li><strong>Edición:</strong> Modificación directa de textos u opciones de respuesta según se requiera.</li>
            <li><strong>Eliminación:</strong> Descarte de aquellos reactivos que no cumplan con los objetivos de 
                evaluación.</li>
        </ul>

        <h2>7. Soporte Técnico</h2>
        <p>Ante incidencias técnicas o errores en la plataforma, el módulo de <strong>Soporte</strong> permite enviar 
            un reporte directo al equipo de desarrollo para su revisión y atención.</p>

        <footer>
            &copy; 2026 SIBAP. Todos los derechos reservados.
        </footer>
        <div class="page-number">3</div>
    </div>

</body>

</html>
`;

export default function ManualPage() {
    useEffect(() => {
        document.title = "Manual de Usuario - SIBAP";
    }, []);

    return (
        <div dangerouslySetInnerHTML={{ __html: manualHtml }} />
    );
}
