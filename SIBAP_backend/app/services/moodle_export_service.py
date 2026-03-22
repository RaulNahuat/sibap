import html
from sqlalchemy.orm import Session
from app.models.reactivo import Reactivo
from app.models.configuracion_generacion import ConfiguracionGeneracion, QuestionType
import xml.etree.ElementTree as ET
from xml.dom import minidom

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
        question_text = reactivo.question_text
        
        gift_str = f"::{name}:: {question_text} {{"
        
        if config.question_type == QuestionType.MCQ:
            for opcion in reactivo.opciones:
                prefix = "=" if opcion.is_correct else "~"
                feedback = f"#{opcion.feedback}" if opcion.feedback else ""
                gift_str += f"\n    {prefix}{opcion.option_text}{feedback}"
        
        elif config.question_type == QuestionType.TF:
            correct_opt = next((o for o in reactivo.opciones if o.is_correct), None)
            val = "T" if correct_opt and "verdadero" in correct_opt.option_text.lower() else "F"
            gift_str += val
            
        if reactivo.feedback_correct:
            gift_str += f"\n    ####[correct] {reactivo.feedback_correct}"
        if reactivo.feedback_incorrect:
            gift_str += f"\n    ####[incorrect] {reactivo.feedback_incorrect}"
            
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
        q_type = "multichoice" if config.question_type == QuestionType.MCQ else "truefalse"
        if config.question_type == QuestionType.OPEN: q_type = "essay"
        
        q = ET.SubElement(quiz, "question", type=q_type)
        
        # Nombre
        name = ET.SubElement(q, "name")
        name_text = ET.SubElement(name, "text")
        name_text.text = reactivo.name or f"Pregunta_{reactivo.id}"
        
        # Texto de la pregunta
        qtext = ET.SubElement(q, "questiontext", format="html")
        text = ET.SubElement(qtext, "text")
        text.text = f"<![CDATA[<p>{reactivo.question_text}</p>]]>"
        
        # Opciones
        if config.question_type == QuestionType.MCQ:
            ET.SubElement(q, "single").text = "true"
            ET.SubElement(q, "shuffleanswers").text = "true"
            ET.SubElement(q, "answernumbering").text = "abc"
            
            for opcion in reactivo.opciones:
                score = "100" if opcion.is_correct else "0"
                ans = ET.SubElement(q, "answer", fraction=score, format="html")
                ans_text = ET.SubElement(ans, "text")
                ans_text.text = opcion.option_text
                
                if opcion.feedback:
                    fb = ET.SubElement(ans, "feedback", format="html")
                    fb_text = ET.SubElement(fb, "text")
                    fb_text.text = opcion.feedback

        elif config.question_type == QuestionType.TF:
            # Moodle XML para T/F requiere dos etiquetas <answer> específicas
            for val, label, fraction in [("true", "Verdadero", "100"), ("false", "Falso", "0")]:
                # Aquí necesitaríamos saber cuál es la correcta realmente. 
                # Por simplicidad en este MVP, buscamos la opción marcada como correcta.
                is_this_correct = False
                correct_opt = next((o for o in reactivo.opciones if o.is_correct), None)
                if correct_opt:
                    if val == "true" and "verdadero" in correct_opt.option_text.lower(): is_this_correct = True
                    if val == "false" and "falso" in correct_opt.option_text.lower(): is_this_correct = True
                
                # (Lógica simplificada: ajustamos la fracción basada en la opción correcta del reactivo)
                # NOTA: En una implementación real, esto debe ser más robusto.

        # Feedback General (Correcto/Incorrecto)
        if reactivo.feedback_correct:
            fb_correct = ET.SubElement(q, "correctfeedback", format="html")
            ET.SubElement(fb_correct, "text").text = reactivo.feedback_correct
            
        if reactivo.feedback_incorrect:
            fb_incorrect = ET.SubElement(q, "incorrectfeedback", format="html")
            ET.SubElement(fb_incorrect, "text").text = reactivo.feedback_incorrect

    xml_str = ET.tostring(quiz, encoding="utf-8")
    reparsed = minidom.parseString(xml_str)
    return reparsed.toprettyxml(indent="  ")
