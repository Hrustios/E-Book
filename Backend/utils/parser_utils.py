import io
import PyPDF2
from docx import Document
import xml.etree.ElementTree as ET


def get_page_count(file_stream, filename):
    filename = filename.lower()
    try:
        if filename.endswith('.pdf'):
            reader = PyPDF2.PdfReader(file_stream)
            return len(reader.pages)

        elif filename.endswith('.docx'):
            doc = Document(file_stream)
            pages = getattr(doc.core_properties, 'pages', 0)
            if pages > 1: return pages
            xml_content = doc.element.xml
            soft_breaks = xml_content.count('w:lastRenderedPageBreak')
            hard_breaks = xml_content.count('w:br w:type="page"')
            total_pages = soft_breaks + hard_breaks + 1
            if total_pages <= 1:
                full_text = "".join(p.text for p in doc.paragraphs)
                return max(1, len(full_text) // 1300)
            return total_pages

        elif filename.endswith('.fb2'):
            file_stream.seek(0)
            content = file_stream.read().decode('utf-8', errors='ignore')
            root = ET.fromstring(content)
            text_nodes = [node.text for node in root.iter() if node.text]
            full_text = "".join(text_nodes)
            return max(1, len(full_text) // 1600)

    except Exception as e:
        print(f"Ошибка парсинга {filename}: {e}")
    return 0