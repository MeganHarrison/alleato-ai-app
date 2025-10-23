import os
import io
import csv
import tempfile
from typing import List, Dict, Any
import pypdf
from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path

# Check if we're in production
is_production = os.getenv("ENVIRONMENT") == "production"

if not is_production:
    # Development: prioritize .env file
    project_root = Path(__file__).resolve().parent.parent
    dotenv_path = project_root / '.env'
    load_dotenv(dotenv_path, override=True)
else:
    # Production: use cloud platform env vars only
    load_dotenv()

# Initialize OpenAI client
api_key = os.getenv("EMBEDDING_API_KEY", "") or "ollama"
openai_client = OpenAI(api_key=api_key, base_url=os.getenv("EMBEDDING_BASE_URL"))

def chunk_text(text: str, chunk_size: int = 400, overlap: int = 0) -> List[str]:
    """
    Split text into chunks of specified size with optional overlap.
    
    Args:
        text: The text to chunk
        chunk_size: Size of each chunk in characters
        overlap: Number of overlapping characters between chunks
        
    Returns:
        List of text chunks
    """
    if not text:
        return []
    
    # Clean the text
    text = text.replace('\r', '')
    
    # Split text into chunks
    chunks = []
    for i in range(0, len(text), chunk_size - overlap):
        chunk = text[i:i + chunk_size]
        if chunk:  # Only add non-empty chunks
            chunks.append(chunk)
    
    return chunks

def chunk_by_speaker(text: str, max_chunk_size: int = 1000, speaker_overlap: int = 1) -> List[Dict[str, Any]]:
    """
    Advanced chunking for meeting transcripts based on speaker turns.
    Creates semantic chunks that preserve conversation context.
    
    Args:
        text: Meeting transcript text
        max_chunk_size: Maximum size per chunk in characters
        speaker_overlap: Number of previous speaker turns to include for context
        
    Returns:
        List of chunk dictionaries with metadata
    """
    import re
    from datetime import datetime
    
    if not text:
        return []
    
    # Pattern to match speaker labels (supports various formats)
    # Examples: "Speaker 1:", "John Doe:", "[10:30] Alice:", "SPEAKER_2:", "Interviewer:"
    speaker_patterns = [
        r'^([A-Z][a-zA-Z\s]+[a-zA-Z]):\s*(.+)$',  # "John Doe: text"
        r'^\[?([A-Z_]+\s?\d*)\]?:\s*(.+)$',      # "SPEAKER_1: text" or "[SPEAKER_1]: text"
        r'^\[([^\]]+)\]\s*([A-Za-z].+)$',       # "[10:30 John]: text"
        r'^([A-Za-z\s]+)\s*-\s*(.+)$',          # "John Doe - text"
    ]
    
    # Extract speaker turns
    turns = []
    lines = text.split('\n')
    current_speaker = None
    current_text = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        speaker_found = False
        for pattern in speaker_patterns:
            match = re.match(pattern, line)
            if match:
                # Save previous speaker's content
                if current_speaker and current_text:
                    turns.append({
                        'speaker': current_speaker,
                        'text': ' '.join(current_text).strip(),
                        'turn_index': len(turns)
                    })
                
                # Start new speaker turn
                current_speaker = match.group(1).strip()
                current_text = [match.group(2).strip()]
                speaker_found = True
                break
        
        if not speaker_found:
            # Continuation of current speaker's text
            if current_text:
                current_text.append(line)
            else:
                # Text without speaker - treat as continuation or unknown speaker
                if not current_speaker:
                    current_speaker = "Unknown Speaker"
                current_text = [line]
    
    # Add final speaker turn
    if current_speaker and current_text:
        turns.append({
            'speaker': current_speaker,
            'text': ' '.join(current_text).strip(),
            'turn_index': len(turns)
        })
    
    if not turns:
        # Fallback to regular chunking if no speakers detected
        regular_chunks = chunk_text(text, max_chunk_size)
        return [{
            'content': chunk,
            'speakers': ['Unknown'],
            'turn_range': [0, 0],
            'chunk_type': 'fallback',
            'metadata': {'original_size': len(chunk)}
        } for chunk in regular_chunks]
    
    # Create semantic chunks with speaker context
    chunks = []
    current_chunk = []
    current_size = 0
    chunk_speakers = set()
    start_turn = 0
    
    for i, turn in enumerate(turns):
        turn_text = f"{turn['speaker']}: {turn['text']}"
        turn_size = len(turn_text)
        
        # Check if adding this turn would exceed max size
        if current_size + turn_size > max_chunk_size and current_chunk:
            # Create chunk with context from previous speakers
            context_turns = []
            if speaker_overlap > 0 and start_turn > 0:
                context_start = max(0, start_turn - speaker_overlap)
                for j in range(context_start, start_turn):
                    context_turn = turns[j]
                    context_turns.append(f"[Context] {context_turn['speaker']}: {context_turn['text'][:100]}...")
            
            chunk_content = '\n'.join(context_turns + current_chunk)
            chunks.append({
                'content': chunk_content,
                'speakers': list(chunk_speakers),
                'turn_range': [start_turn, i - 1],
                'chunk_type': 'speaker_based',
                'metadata': {
                    'turn_count': len(current_chunk),
                    'has_context': len(context_turns) > 0,
                    'primary_speakers': list(chunk_speakers),
                    'size': len(chunk_content)
                }
            })
            
            # Reset for next chunk
            current_chunk = []
            current_size = 0
            chunk_speakers = set()
            start_turn = i
        
        # Add current turn to chunk
        current_chunk.append(turn_text)
        current_size += turn_size + 1  # +1 for newline
        chunk_speakers.add(turn['speaker'])
    
    # Add final chunk
    if current_chunk:
        context_turns = []
        if speaker_overlap > 0 and start_turn > 0:
            context_start = max(0, start_turn - speaker_overlap)
            for j in range(context_start, start_turn):
                context_turn = turns[j]
                context_turns.append(f"[Context] {context_turn['speaker']}: {context_turn['text'][:100]}...")
        
        chunk_content = '\n'.join(context_turns + current_chunk)
        chunks.append({
            'content': chunk_content,
            'speakers': list(chunk_speakers),
            'turn_range': [start_turn, len(turns) - 1],
            'chunk_type': 'speaker_based',
            'metadata': {
                'turn_count': len(current_chunk),
                'has_context': len(context_turns) > 0,
                'primary_speakers': list(chunk_speakers),
                'size': len(chunk_content)
            }
        })
    
    return chunks

def chunk_by_semantic_similarity(text: str, similarity_threshold: float = 0.7, max_chunk_size: int = 800) -> List[Dict[str, Any]]:
    """
    Advanced semantic chunking that groups similar content together.
    Uses sentence embeddings to create semantically coherent chunks.
    
    Args:
        text: Text to chunk
        similarity_threshold: Minimum similarity to group sentences
        max_chunk_size: Maximum chunk size in characters
        
    Returns:
        List of semantic chunk dictionaries
    """
    import re
    import numpy as np
    from sklearn.metrics.pairwise import cosine_similarity
    
    if not text or len(text) < 100:
        return [{'content': text, 'chunk_type': 'small_text', 'metadata': {'size': len(text)}}]
    
    # Split into sentences
    sentence_pattern = r'(?<=[.!?])\s+(?=[A-Z])'
    sentences = re.split(sentence_pattern, text.strip())
    sentences = [s.strip() for s in sentences if s.strip()]
    
    if len(sentences) < 2:
        return [{'content': text, 'chunk_type': 'single_sentence', 'metadata': {'size': len(text)}}]
    
    try:
        # Create embeddings for sentences (using the existing OpenAI client)
        embeddings = create_embeddings(sentences)
        embeddings = np.array(embeddings)
        
        # Calculate similarity matrix
        similarity_matrix = cosine_similarity(embeddings)
        
        # Group sentences by similarity
        chunks = []
        used_sentences = set()
        
        for i, sentence in enumerate(sentences):
            if i in used_sentences:
                continue
                
            current_chunk = [sentence]
            current_size = len(sentence)
            used_sentences.add(i)
            
            # Find similar sentences
            similarities = similarity_matrix[i]
            similar_indices = []
            
            for j, sim_score in enumerate(similarities):
                if j != i and j not in used_sentences and sim_score >= similarity_threshold:
                    similar_indices.append((j, sim_score))
            
            # Sort by similarity and add to chunk if within size limit
            similar_indices.sort(key=lambda x: x[1], reverse=True)
            
            for j, sim_score in similar_indices:
                sentence_text = sentences[j]
                if current_size + len(sentence_text) + 1 <= max_chunk_size:
                    current_chunk.append(sentence_text)
                    current_size += len(sentence_text) + 1
                    used_sentences.add(j)
            
            # Create chunk
            chunk_content = ' '.join(current_chunk)
            chunks.append({
                'content': chunk_content,
                'chunk_type': 'semantic',
                'metadata': {
                    'sentence_count': len(current_chunk),
                    'avg_similarity': np.mean([similarities[j] for j, _ in similar_indices[:len(current_chunk)-1]]) if len(current_chunk) > 1 else 0,
                    'size': len(chunk_content),
                    'sentence_indices': [i] + [j for j, _ in similar_indices[:len(current_chunk)-1]]
                }
            })
        
        return chunks
        
    except Exception as e:
        print(f"Error in semantic chunking: {e}")
        # Fallback to regular chunking
        regular_chunks = chunk_text(text, max_chunk_size)
        return [{
            'content': chunk,
            'chunk_type': 'fallback_semantic',
            'metadata': {'size': len(chunk), 'error': str(e)}
        } for chunk in regular_chunks]

def adaptive_chunk_text(text: str, file_name: str = "", mime_type: str = "", config: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """
    Intelligent chunking that adapts strategy based on content type and structure.
    
    Args:
        text: Text to chunk
        file_name: Original file name for context
        mime_type: MIME type for content type detection
        config: Configuration dictionary
        
    Returns:
        List of adaptive chunk dictionaries with metadata
    """
    if not text:
        return []
    
    # Default configuration
    default_config = {
        'max_chunk_size': 800,
        'speaker_overlap': 1,
        'semantic_threshold': 0.7,
        'min_chunk_size': 100
    }
    
    if config:
        default_config.update(config.get('adaptive_chunking', {}))
    
    # Detect content type and choose strategy
    is_meeting_transcript = _detect_meeting_transcript(text, file_name)
    is_structured_document = _detect_structured_document(text)
    is_conversational = _detect_conversational_content(text)
    
    if is_meeting_transcript:
        return chunk_by_speaker(
            text, 
            max_chunk_size=default_config['max_chunk_size'],
            speaker_overlap=default_config['speaker_overlap']
        )
    elif is_structured_document:
        return _chunk_structured_document(text, default_config)
    elif is_conversational:
        return chunk_by_semantic_similarity(
            text,
            similarity_threshold=default_config['semantic_threshold'],
            max_chunk_size=default_config['max_chunk_size']
        )
    else:
        # Use enhanced paragraph-based chunking for general text
        return _chunk_by_paragraphs_enhanced(text, default_config)

def _detect_meeting_transcript(text: str, file_name: str = "") -> bool:
    """Detect if text is a meeting transcript."""
    import re
    
    # File name indicators
    transcript_keywords = ['transcript', 'meeting', 'call', 'interview', 'session', 'recording']
    if file_name and any(keyword in file_name.lower() for keyword in transcript_keywords):
        return True
    
    # Content indicators
    speaker_patterns = [
        r'\b[A-Z][a-zA-Z\s]+:\s',  # "John Doe: "
        r'\b[A-Z_]+\d*:\s',        # "SPEAKER_1: "
        r'\[[^\]]+\]\s*[A-Z]',     # "[10:30] Text" or "[John] Text"
        r'>\s*[A-Z][a-zA-Z\s]+:',  # "> John Doe:"
    ]
    
    speaker_matches = sum(len(re.findall(pattern, text)) for pattern in speaker_patterns)
    total_lines = len([line for line in text.split('\n') if line.strip()])
    
    # If more than 20% of lines have speaker patterns, likely a transcript
    return total_lines > 0 and (speaker_matches / total_lines) > 0.2

def _detect_structured_document(text: str) -> bool:
    """Detect if text has structured formatting (headers, lists, etc.)."""
    import re
    
    # Look for markdown-style headers, numbered lists, bullet points
    structure_patterns = [
        r'^#{1,6}\s+.+$',          # Markdown headers
        r'^\d+\.\s+.+$',          # Numbered lists
        r'^[-*+]\s+.+$',          # Bullet points
        r'^[A-Z][A-Z\s]+$',       # ALL CAPS headers
        r'^\s*\|.+\|\s*$',       # Table rows
    ]
    
    structure_matches = 0
    for pattern in structure_patterns:
        structure_matches += len(re.findall(pattern, text, re.MULTILINE))
    
    total_lines = len([line for line in text.split('\n') if line.strip()])
    return total_lines > 0 and (structure_matches / total_lines) > 0.15

def _detect_conversational_content(text: str) -> bool:
    """Detect conversational or Q&A style content."""
    import re
    
    # Look for question patterns and conversational markers
    conversation_patterns = [
        r'\?\s*$',                    # Questions
        r'\b(Q:|A:|Question:|Answer:)', # Q&A format
        r'\b(well|so|actually|basically|you know)\b',  # Conversational markers
        r'\b(I think|I believe|In my opinion)\b',      # Opinion markers
    ]
    
    conv_matches = sum(len(re.findall(pattern, text, re.IGNORECASE)) for pattern in conversation_patterns)
    word_count = len(text.split())
    
    return word_count > 0 and (conv_matches / word_count) > 0.05

def _chunk_structured_document(text: str, config: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Chunk structured documents by preserving headers and sections."""
    import re
    
    lines = text.split('\n')
    chunks = []
    current_section = []
    current_size = 0
    current_header = ""
    
    header_pattern = r'^(#{1,6}\s+.+|[A-Z][A-Z\s]+|\d+\.\s+.+|[-*+]\s+.+)$'
    
    for line in lines:
        line_stripped = line.strip()
        
        # Check if this is a header
        if re.match(header_pattern, line_stripped) and len(line_stripped) < 100:
            # Save previous section if it exists
            if current_section and current_size >= config['min_chunk_size']:
                chunk_content = '\n'.join(current_section)
                chunks.append({
                    'content': chunk_content,
                    'chunk_type': 'structured_section',
                    'metadata': {
                        'header': current_header,
                        'size': current_size,
                        'line_count': len(current_section)
                    }
                })
            
            # Start new section
            current_header = line_stripped
            current_section = [line]
            current_size = len(line)
        else:
            # Add to current section
            current_section.append(line)
            current_size += len(line) + 1
            
            # Check if section is getting too large
            if current_size > config['max_chunk_size']:
                chunk_content = '\n'.join(current_section)
                chunks.append({
                    'content': chunk_content,
                    'chunk_type': 'structured_section',
                    'metadata': {
                        'header': current_header,
                        'size': current_size,
                        'line_count': len(current_section),
                        'truncated': True
                    }
                })
                
                # Reset
                current_section = []
                current_size = 0
                current_header = ""
    
    # Add final section
    if current_section:
        chunk_content = '\n'.join(current_section)
        chunks.append({
            'content': chunk_content,
            'chunk_type': 'structured_section',
            'metadata': {
                'header': current_header,
                'size': len(chunk_content),
                'line_count': len(current_section)
            }
        })
    
    return chunks if chunks else [{
        'content': text,
        'chunk_type': 'structured_fallback',
        'metadata': {'size': len(text)}
    }]

def _chunk_by_paragraphs_enhanced(text: str, config: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Enhanced paragraph-based chunking with overlap and context preservation."""
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    
    if not paragraphs:
        return [{'content': text, 'chunk_type': 'single_paragraph', 'metadata': {'size': len(text)}}]
    
    chunks = []
    current_chunk = []
    current_size = 0
    
    for i, paragraph in enumerate(paragraphs):
        para_size = len(paragraph)
        
        # Check if adding this paragraph exceeds max size
        if current_size + para_size > config['max_chunk_size'] and current_chunk:
            # Create chunk
            chunk_content = '\n\n'.join(current_chunk)
            chunks.append({
                'content': chunk_content,
                'chunk_type': 'paragraph_based',
                'metadata': {
                    'paragraph_count': len(current_chunk),
                    'size': current_size,
                    'paragraph_range': [i - len(current_chunk), i - 1]
                }
            })
            
            # Start new chunk with potential overlap
            if len(current_chunk) > 1:  # Add last paragraph for context
                current_chunk = [current_chunk[-1], paragraph]
                current_size = len(current_chunk[-2]) + para_size + 2
            else:
                current_chunk = [paragraph]
                current_size = para_size
        else:
            current_chunk.append(paragraph)
            current_size += para_size + 2  # +2 for double newlines
    
    # Add final chunk
    if current_chunk:
        chunk_content = '\n\n'.join(current_chunk)
        chunks.append({
            'content': chunk_content,
            'chunk_type': 'paragraph_based',
            'metadata': {
                'paragraph_count': len(current_chunk),
                'size': len(chunk_content),
                'paragraph_range': [len(paragraphs) - len(current_chunk), len(paragraphs) - 1]
            }
        })
    
    return chunks

def extract_text_from_pdf(file_content: bytes) -> str:
    """
    Extract text from a PDF file.
    
    Args:
        file_content: Binary content of the PDF file
        
    Returns:
        Extracted text from the PDF
    """
    # Create a temporary file to store the PDF content
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
        temp_file.write(file_content)
        temp_file_path = temp_file.name
    
    try:
        # Open the PDF file
        with open(temp_file_path, 'rb') as file:
            pdf_reader = pypdf.PdfReader(file)
            text = ""
            
            # Extract text from each page
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n\n"
        
        return text
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

def extract_text_from_file(file_content: bytes, mime_type: str, file_name: str, config: Dict[str, Any] = None) -> str:
    """
    Extract text from a file based on its MIME type.
    
    Args:
        file_content: Binary content of the file
        mime_type: MIME type of the file
        file_name: Name of the file for context
        config: Configuration dictionary with supported_mime_types
        
    Returns:
        Extracted text from the file
    """
    supported_mime_types = []
    if config and 'supported_mime_types' in config:
        supported_mime_types = config['supported_mime_types']
    
    if 'application/pdf' in mime_type:
        return extract_text_from_pdf(file_content)
    elif mime_type.startswith('image'):
        return file_name
    elif config and any(mime_type.startswith(t) for t in supported_mime_types):
        return file_content.decode('utf-8', errors='replace')
    else:
        # For unsupported file types, just try to extract the text
        return file_content.decode('utf-8', errors='replace')

def process_and_chunk_text(text: str, file_name: str = "", mime_type: str = "", config: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """
    Enhanced text processing that automatically selects the best chunking strategy.
    
    Args:
        text: The text content to process
        file_name: Original file name for context
        mime_type: MIME type for additional context
        config: Configuration dictionary with chunking settings
        
    Returns:
        List of processed chunks with metadata
    """
    if not text:
        return []
    
    # Use adaptive chunking by default
    chunks = adaptive_chunk_text(text, file_name, mime_type, config)
    
    # Add processing metadata to each chunk
    processed_chunks = []
    for i, chunk in enumerate(chunks):
        processed_chunk = {
            'content': chunk['content'],
            'chunk_index': i,
            'chunk_type': chunk.get('chunk_type', 'unknown'),
            'metadata': {
                'original_file': file_name,
                'mime_type': mime_type,
                'processing_timestamp': None,  # Will be set when processed
                **chunk.get('metadata', {})
            }
        }
        
        # Add speaker information for transcripts
        if 'speakers' in chunk:
            processed_chunk['metadata']['speakers'] = chunk['speakers']
        
        # Add turn range for meeting transcripts
        if 'turn_range' in chunk:
            processed_chunk['metadata']['turn_range'] = chunk['turn_range']
        
        processed_chunks.append(processed_chunk)
    
    return processed_chunks

def create_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Create embeddings for a list of text chunks using OpenAI.
    
    Args:
        texts: List of text chunks to embed
        
    Returns:
        List of embedding vectors
    """
    if not texts:
        return []
    
    # Handle batch processing for large lists
    batch_size = 100  # Process in batches to avoid API limits
    all_embeddings = []
    
    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i:i + batch_size]
        
        response = openai_client.embeddings.create(
            model=os.getenv("EMBEDDING_MODEL_CHOICE"),
            input=batch_texts
        )
        
        # Extract the embedding vectors from the response
        batch_embeddings = [item.embedding for item in response.data]
        all_embeddings.extend(batch_embeddings)
    
    return all_embeddings

def create_enhanced_embeddings(chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Create embeddings for processed chunks with enhanced metadata.
    
    Args:
        chunks: List of processed chunk dictionaries
        
    Returns:
        List of chunks with embeddings and enhanced metadata
    """
    if not chunks:
        return []
    
    # Extract text content for embedding
    texts = [chunk['content'] for chunk in chunks]
    
    # Create embeddings
    embeddings = create_embeddings(texts)
    
    # Add embeddings to chunks
    enhanced_chunks = []
    for i, chunk in enumerate(chunks):
        enhanced_chunk = chunk.copy()
        enhanced_chunk['embedding'] = embeddings[i] if i < len(embeddings) else []
        
        # Add embedding metadata
        enhanced_chunk['metadata']['embedding_model'] = os.getenv("EMBEDDING_MODEL_CHOICE")
        enhanced_chunk['metadata']['embedding_dimensions'] = len(embeddings[i]) if i < len(embeddings) else 0
        
        # Calculate content statistics
        content = chunk['content']
        enhanced_chunk['metadata']['content_stats'] = {
            'character_count': len(content),
            'word_count': len(content.split()),
            'sentence_count': len([s for s in content.split('.') if s.strip()]),
            'has_dialogue': ':' in content and any(marker in content.lower() for marker in ['speaker', 'said', 'replied'])
        }
        
        enhanced_chunks.append(enhanced_chunk)
    
    return enhanced_chunks

def is_tabular_file(mime_type: str, config: Dict[str, Any] = None) -> bool:
    """
    Check if a file is tabular based on its MIME type.
    
    Args:
        mime_type: The MIME type of the file
        config: Optional configuration dictionary
        
    Returns:
        bool: True if the file is tabular (CSV or Excel), False otherwise
    """
    # Default tabular MIME types if config is not provided
    tabular_mime_types = [
        'csv',
        'xlsx',
        'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.google-apps.spreadsheet'
    ]
    
    # Use tabular_mime_types from config if available
    if config and 'tabular_mime_types' in config:
        tabular_mime_types = config['tabular_mime_types']
    
    return any(mime_type.startswith(t) for t in tabular_mime_types)

def extract_schema_from_csv(file_content: bytes) -> List[str]:
    """
    Extract column names from a CSV file.
    
    Args:
        file_content: The binary content of the CSV file
        
    Returns:
        List[str]: List of column names
    """
    try:
        # Decode the CSV content
        text_content = file_content.decode('utf-8', errors='replace')
        csv_reader = csv.reader(io.StringIO(text_content))
        # Get the header row (first row)
        header = next(csv_reader)
        return header
    except Exception as e:
        print(f"Error extracting schema from CSV: {e}")
        return []

def extract_rows_from_csv(file_content: bytes) -> List[Dict[str, Any]]:
    """
    Extract rows from a CSV file as a list of dictionaries.
    
    Args:
        file_content: The binary content of the CSV file
        
    Returns:
        List[Dict[str, Any]]: List of row data as dictionaries
    """
    try:
        # Decode the CSV content
        text_content = file_content.decode('utf-8', errors='replace')
        csv_reader = csv.DictReader(io.StringIO(text_content))
        return list(csv_reader)
    except Exception as e:
        print(f"Error extracting rows from CSV: {e}")
        return []    
