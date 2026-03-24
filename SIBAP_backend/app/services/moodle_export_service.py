import html
import re
from sqlalchemy.orm import Session
from app.models.reactivo import Reactivo
from app.models.configuracion_generacion import ConfiguracionGeneracion, QuestionType
import xml.etree.ElementTree as ET
from xml.dom import minidom

def format_moodle_text(text: str) -> str:
    """
    Formatea el texto para compatibilidad con Moodle:
    1. Protege signos de moneda ya escapados (\\$) con un placeholder.
    2. Convierte $...$ a \\(...\\) para el filtro MathJax de Moodle.
    3. Restaura los placeholders como $ (símbolo de moneda literal).
    4. Escapa todo $ restante como &#36; para que Moodle no lo confunda con fórmulas.
    """
    if not text:
        return ""
    
    # 1. Proteger signos de moneda escapados (\$195,000 -> ESCAPED_DOLLAR_SIGN195,000)
    text = text.replace(r"\$", "ESCAPED_DOLLAR_SIGN")
    
    # 2. Transformar $...$ a \(...\) (Filtro MathJax de Moodle para bloque en línea)
    text = re.sub(r'\$([^$]+)\$', r'\\(\1\\)', text)
    
    # 3. Restaurar los signos de dólar protegidos (símbolo de moneda literal)
    text = text.replace("ESCAPED_DOLLAR_SIGN", "$")
    
    # 4. Escapar cualquier $ restante (ej: $30,000 sin escapar) como entidad HTML
    #    para que Moodle no lo interprete como inicio de fórmula.
    text = text.replace("$", "&#36;")
    
    return text

def escape_gift_text(text: str) -> str:
    """
    Escapa los caracteres de control exclusivos del formato GIFT.
    Los caracteres ~, =, #, {, }, : deben ir precedidos por una barra invertida \\.
    Moodle detectará que están escapados y los restaurará internamente a su valor original de LaTeX o texto.
    """
    if not text:
        return ""
    result = ""
    for char in text:
        if char in ['~', '=', '#', '{', '}', ':']:
            result += '\\' + char
        else:
            result += char
    return result

def export_to_gift(db: Session, config_id: int) -> str:
    config = db.query(ConfiguracionGeneracion).filter(ConfiguracionGeneracion.id == config_id).first()
    if not config:
        return ""
    
    gift_lines = []
    
    sub_name = config.materia_obj.nombre if config.materia_obj else "Sin Materia"
    top_name = config.tema_obj.nombre if config.tema_obj else "Sin Tema"
    category = f"{sub_name} / {top_name}"
    gift_lines.append(f"$CATEGORY: $course$/{category}\n")

    for reactivo in config.reactivos:
        name = reactivo.name or f"Pregunta_{reactivo.id}"
        # Determine per-reactivo type (falls back to config type for legacy data)
        r_type = reactivo.question_type or config.question_type
        # Solo escapamos los caracteres de control Moodle en el contenido, no en los metadatos de formato
        question_text = escape_gift_text(format_moodle_text(reactivo.question_text))
        
        gift_str = f"::{name}:: [html]{question_text} {{"
        
        if r_type == QuestionType.MCQ:
            for opcion in reactivo.opciones:
                prefix = "=" if opcion.is_correct else "~"
                opt_text = escape_gift_text(format_moodle_text(opcion.option_text))
                
                feedback_str = ""
                if opcion.feedback:
                    feedback_text = escape_gift_text(format_moodle_text(opcion.feedback))
                    feedback_str = f"#[html]{feedback_text}"
                
                gift_str += f"\n    {prefix}[html]{opt_text}{feedback_str}"
        
        elif r_type == QuestionType.TF:
            correct_opt = next((o for o in reactivo.opciones if o.is_correct), None)
            val = "T" if correct_opt and "verdadero" in correct_opt.option_text.lower() else "F"
            gift_str += val

        elif r_type == QuestionType.MATCHING:
            # Each option is formatted as "Término | Definición"
            for opcion in reactivo.opciones:
                parts = opcion.option_text.split("|", 1)
                if len(parts) == 2:
                    left = escape_gift_text(format_moodle_text(parts[0].strip()))
                    right = escape_gift_text(format_moodle_text(parts[1].strip()))
                else:
                    left = escape_gift_text(format_moodle_text(opcion.option_text))
                    right = left
                gift_str += f"\n    ={left} -> {right}"

        elif r_type in (QuestionType.CALCULATED, QuestionType.OPEN):
            # Export as short answer / essay
            correct_opt = next((o for o in reactivo.opciones if o.is_correct), None)
            if correct_opt:
                opt_text = escape_gift_text(format_moodle_text(correct_opt.option_text))
                gift_str += f"\n    ={opt_text}"
            
        if reactivo.feedback_correct:
            fb_correct = escape_gift_text(format_moodle_text(reactivo.feedback_correct))
            gift_str += f"\n    ####[html]{fb_correct}"
        if reactivo.feedback_incorrect:
            fb_incorrect = escape_gift_text(format_moodle_text(reactivo.feedback_incorrect))
            gift_str += f"\n    ####[html]{fb_incorrect}"
            
        gift_str += "\n}\n"
        gift_lines.append(gift_str)

    return "\n".join(gift_lines)

def export_to_xml(db: Session, config_id: int) -> str:
    config = db.query(ConfiguracionGeneracion).filter(ConfiguracionGeneracion.id == config_id).first()
    if not config:
        return ""

    quiz = ET.Element("quiz")
    
    # Categoría
    question_cat = ET.SubElement(quiz, "question", type="category")
    category = ET.SubElement(question_cat, "category")
    text_cat = ET.SubElement(category, "text")
    sub_name = config.materia_obj.nombre if config.materia_obj else "Sin Materia"
    top_name = config.tema_obj.nombre if config.tema_obj else "Sin Tema"
    text_cat.text = f"$course$/{sub_name}/{top_name}"

    for reactivo in config.reactivos:
        # Determine per-reactivo type
        r_type = reactivo.question_type or config.question_type

        if r_type == QuestionType.MCQ:
            q_type_str = "multichoice"
        elif r_type == QuestionType.TF:
            q_type_str = "truefalse"
        elif r_type == QuestionType.MATCHING:
            q_type_str = "matching"
        elif r_type == QuestionType.CALCULATED:
            q_type_str = "calculated"
        else:
            q_type_str = "essay"
        
        q = ET.SubElement(quiz, "question", type=q_type_str)
        
        # Nombre
        name = ET.SubElement(q, "name")
        name_text = ET.SubElement(name, "text")
        name_text.text = reactivo.name or f"Pregunta_{reactivo.id}"
        
        # Texto de la pregunta
        qtext = ET.SubElement(q, "questiontext", format="html")
        text = ET.SubElement(qtext, "text")
        text.text = f"<![CDATA[{format_moodle_text(reactivo.question_text)}]]>"
        
        # Opciones por tipo
        if r_type == QuestionType.MCQ:
            ET.SubElement(q, "single").text = "true"
            ET.SubElement(q, "shuffleanswers").text = "true"
            ET.SubElement(q, "answernumbering").text = "abc"
            
            for opcion in reactivo.opciones:
                score = "100" if opcion.is_correct else "0"
                ans = ET.SubElement(q, "answer", fraction=score, format="html")
                ans_text = ET.SubElement(ans, "text")
                ans_text.text = f"<![CDATA[{format_moodle_text(opcion.option_text)}]]>"
                
                if opcion.feedback:
                    fb = ET.SubElement(ans, "feedback", format="html")
                    fb_text = ET.SubElement(fb, "text")
                    fb_text.text = f"<![CDATA[{format_moodle_text(opcion.feedback)}]]>"

        elif r_type == QuestionType.TF:
            correct_opt = next((o for o in reactivo.opciones if o.is_correct), None)
            is_true_correct = correct_opt and "verdadero" in correct_opt.option_text.lower()
            
            for val, label in [("true", "Verdadero"), ("false", "Falso")]:
                fraction = "100" if (val == "true" and is_true_correct) or (val == "false" and not is_true_correct) else "0"
                ans = ET.SubElement(q, "answer", fraction=fraction, format="moodle_auto_format")
                ans_text = ET.SubElement(ans, "text")
                ans_text.text = val
                
                fb = ET.SubElement(ans, "feedback", format="html")
                fb_text = ET.SubElement(fb, "text")
                fb_text.text = f"<![CDATA[{label}]]>"

        elif r_type == QuestionType.MATCHING:
            ET.SubElement(q, "shuffleanswers").text = "true"
            for opcion in reactivo.opciones:
                parts = opcion.option_text.split("|", 1)
                if len(parts) == 2:
                    left, right = parts[0].strip(), parts[1].strip()
                else:
                    left = right = opcion.option_text.strip()
                subq = ET.SubElement(q, "subquestion", format="html")
                sq_text = ET.SubElement(subq, "text")
                sq_text.text = f"<![CDATA[{format_moodle_text(left)}]]>"
                ans = ET.SubElement(subq, "answer")
                ans_text = ET.SubElement(ans, "text")
                ans_text.text = f"<![CDATA[{format_moodle_text(right)}]]>"

        elif r_type == QuestionType.CALCULATED:
            correct_opt = next((o for o in reactivo.opciones if o.is_correct), None)
            if correct_opt:
                ans = ET.SubElement(q, "answer", fraction="100", format="html")
                ans_text = ET.SubElement(ans, "text")
                ans_text.text = f"<![CDATA[{format_moodle_text(correct_opt.option_text)}]]>"
                if correct_opt.feedback:
                    fb = ET.SubElement(ans, "feedback", format="html")
                    fb_text = ET.SubElement(fb, "text")
                    fb_text.text = f"<![CDATA[{format_moodle_text(correct_opt.feedback)}]]>"

        # Feedback General (Correcto/Incorrecto)
        if reactivo.feedback_correct:
            fb_correct = ET.SubElement(q, "correctfeedback", format="html")
            ET.SubElement(fb_correct, "text").text = f"<![CDATA[{format_moodle_text(reactivo.feedback_correct)}]]>"
            
        if reactivo.feedback_incorrect:
            fb_incorrect = ET.SubElement(q, "incorrectfeedback", format="html")
            ET.SubElement(fb_incorrect, "text").text = f"<![CDATA[{format_moodle_text(reactivo.feedback_incorrect)}]]>"

    xml_str = ET.tostring(quiz, encoding="utf-8").decode("utf-8")
    
    def unescape_cdata(match):
        return f"<![CDATA[{html.unescape(match.group(1))}]]>"
        
    xml_str = re.sub(r"&lt;!\[CDATA\[(.*?)\]\]&gt;", unescape_cdata, xml_str, flags=re.DOTALL)
    reparsed = minidom.parseString(xml_str.encode("utf-8"))
    return reparsed.toprettyxml(indent="  ")
