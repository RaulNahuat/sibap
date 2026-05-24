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
    
    text = text.replace(r"\$", "ESCAPED_DOLLAR_SIGN")
    
    text = re.sub(r'\$([^$]+)\$', r'\\(\1\\)', text)
    
    text = text.replace("ESCAPED_DOLLAR_SIGN", "$")
    
    text = text.replace("$", "&#36;")
    
    return text

def export_to_xml(db: Session, config_id: int) -> str:
    config = db.query(ConfiguracionGeneracion).filter(ConfiguracionGeneracion.id == config_id).first()
    if not config:
        return ""

    quiz = ET.Element("quiz")
    
    question_cat = ET.SubElement(quiz, "question", type="category")
    category = ET.SubElement(question_cat, "category")
    text_cat = ET.SubElement(category, "text")
    sub_name = config.materia_obj.nombre if config.materia_obj else "Sin Materia"
    top_name = config.tema_obj.nombre if config.tema_obj else "Sin Tema"
    text_cat.text = f"$course$/{sub_name}/{top_name}"

    for reactivo in config.reactivos:
        r_type = reactivo.question_type or config.question_type
        # Obtener el valor en cadena para evitar discrepancias de tipo (Enum vs String de la BD)
        r_type_val = r_type.value if hasattr(r_type, "value") else str(r_type)
        if isinstance(r_type_val, str):
            r_type_val = r_type_val.upper()

        if r_type_val == "MIXED":
            # Detección heurística para preguntas MIXED: si todas las opciones tienen '|', es MATCHING
            is_matching_format = all("|" in opt.option_text for opt in reactivo.opciones) if reactivo.opciones else False
            if is_matching_format and len(reactivo.opciones) >= 2:
                r_type_val = "MATCHING"
            else:
                r_type_val = "MCQ"

        if r_type_val == "MCQ":
            q_type_str = "multichoice"
        elif r_type_val == "TF":
            q_type_str = "truefalse"
        elif r_type_val == "MATCHING":
            q_type_str = "matching"
        elif r_type_val == "CALCULATED":
            q_type_str = "numerical"
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
        if r_type_val == "MCQ":
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

        elif r_type_val == "TF":
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

        elif r_type_val == "MATCHING":
            ET.SubElement(q, "shuffleanswers").text = "true"
            for opcion in reactivo.opciones:
                parts = opcion.option_text.split("|", 1)
                if len(parts) == 2:
                    left, right = parts[0].strip(), parts[1].strip()
                else:
                    left = right = opcion.option_text.strip()
                subq = ET.SubElement(q, "subquestion", format="html")
                sq_text = ET.SubElement(subq, "text")
                styled_left = f'<div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #e2e8f0;">{format_moodle_text(left)}</div>'
                sq_text.text = f"<![CDATA[{styled_left}]]>"
                ans = ET.SubElement(subq, "answer")
                ans_text = ET.SubElement(ans, "text")
                ans_text.text = f"<![CDATA[{format_moodle_text(right)}]]>"

        elif r_type_val == "CALCULATED":
            correct_opt = next((o for o in reactivo.opciones if o.is_correct), None)
            if correct_opt:
                match = re.search(r"[-+]?\d*\.?\d+", correct_opt.option_text)
                numeric_val = match.group(0) if match else correct_opt.option_text.strip()
                
                ans = ET.SubElement(q, "answer", fraction="100", format="moodle_auto_format")
                ans_text = ET.SubElement(ans, "text")
                ans_text.text = numeric_val
                
                # Tolerancia
                ET.SubElement(ans, "tolerance").text = "0.01"
                
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
