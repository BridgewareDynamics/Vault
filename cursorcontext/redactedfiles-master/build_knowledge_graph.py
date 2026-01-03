"""
Build a knowledge graph from court documents.
Extracts entities (people, orgs, dates, locations) and relationships.
"""

import fitz  # PyMuPDF
import re
import json
import csv
from pathlib import Path
from collections import defaultdict
from datetime import datetime
import sys

try:
    import spacy
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False
    print("⚠ spaCy not available. Install with: pip install spacy")
    print("  Then download model: python -m spacy download en_core_web_sm")

try:
    import networkx as nx
    NETWORKX_AVAILABLE = True
except ImportError:
    NETWORKX_AVAILABLE = False
    print("⚠ NetworkX not available. Install with: pip install networkx")

try:
    import plotly.graph_objects as go
    PLOTLY_AVAILABLE = True
except ImportError:
    PLOTLY_AVAILABLE = False
    print("⚠ Plotly not available. Install with: pip install plotly")


class KnowledgeGraph:
    """Knowledge graph builder for court documents."""
    
    def __init__(self):
        self.entities = defaultdict(lambda: {"type": None, "mentions": 0, "documents": set()})
        self.relationships = []
        self.documents = {}
        
        # Load spaCy model if available
        if SPACY_AVAILABLE:
            try:
                self.nlp = spacy.load("en_core_web_sm")
                print("✓ Loaded spaCy model")
            except:
                print("⚠ spaCy model not found. Run: python -m spacy download en_core_web_sm")
                self.nlp = None
        else:
            self.nlp = None
    
    def extract_text_from_pdf(self, pdf_path: Path) -> str:
        """Extract all text from a PDF."""
        try:
            doc = fitz.open(str(pdf_path))
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            return text
        except Exception as e:
            print(f"  ✗ Error extracting text from {pdf_path.name}: {e}")
            return ""
    
    def parse_case_metadata(self, filename: str) -> dict:
        """Extract case metadata from filename."""
        metadata = {
            "case_name": None,
            "case_number": None,
            "court": None,
            "year": None,
            "document_id": None
        }
        
        # Pattern: "Case Name, No. case-number (Court Year)____doc-id.pdf"
        pattern = r"^(.+?),\s+No\.\s+([^\(]+)\s+\(([^\)]+)\)____(.+?)\.pdf$"
        match = re.match(pattern, filename)
        
        if match:
            metadata["case_name"] = match.group(1).strip()
            metadata["case_number"] = match.group(2).strip()
            court_year = match.group(3).strip()
            metadata["document_id"] = match.group(4).strip()
            
            # Parse court and year
            year_match = re.search(r'\b(19|20)\d{2}\b', court_year)
            if year_match:
                metadata["year"] = int(year_match.group())
                metadata["court"] = court_year[:year_match.start()].strip()
            else:
                metadata["court"] = court_year
        
        return metadata
    
    def extract_entities_regex(self, text: str) -> dict:
        """Extract entities using regex patterns (fallback when spaCy unavailable)."""
        entities = {
            "PERSON": set(),
            "ORG": set(),
            "DATE": set(),
            "CASE_NUMBER": set()
        }
        
        # Case numbers
        case_numbers = re.findall(r'\b\d{2,3}-(?:cv|cr|mc)-\d{4,5}\b', text, re.IGNORECASE)
        entities["CASE_NUMBER"].update(case_numbers)
        
        # Dates (simple pattern)
        dates = re.findall(r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b', text)
        entities["DATE"].update(dates)
        
        # Common titles (helps identify names)
        titles = r'\b(?:Judge|Justice|Mr\.|Mrs\.|Ms\.|Dr\.|Attorney|Esq\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)'
        names = re.findall(titles, text)
        entities["PERSON"].update(names)
        
        # Law firms (containing "LLP", "LLC", "P.C.", etc.)
        firms = re.findall(r'\b([A-Z][a-z]+(?:,?\s+[A-Z][a-z]+)*(?:\s+LLP|\s+LLC|\s+P\.C\.|\s+&\s+[A-Z][a-z]+)+)\b', text)
        entities["ORG"].update(firms)
        
        return entities
    
    def extract_entities_spacy(self, text: str) -> dict:
        """Extract entities using spaCy NER."""
        if not self.nlp:
            return self.extract_entities_regex(text)
        
        # Limit text length for processing
        max_chars = 100000
        if len(text) > max_chars:
            text = text[:max_chars]
        
        doc = self.nlp(text)
        
        entities = defaultdict(set)
        for ent in doc.ents:
            if ent.label_ in ["PERSON", "ORG", "GPE", "DATE", "LAW", "NORP"]:
                # Clean and filter
                entity_text = ent.text.strip()
                if len(entity_text) > 2 and not entity_text.isdigit():
                    entities[ent.label_].add(entity_text)
        
        # Also extract case numbers with regex
        case_numbers = re.findall(r'\b\d{2,3}-(?:cv|cr|mc)-\d{4,5}\b', text, re.IGNORECASE)
        entities["CASE_NUMBER"].update(case_numbers)
        
        return entities
    
    def process_document(self, pdf_path: Path) -> dict:
        """Process a single PDF document."""
        print(f"\nProcessing: {pdf_path.name}")
        
        # Extract metadata from filename
        metadata = self.parse_case_metadata(pdf_path.name)
        
        # Extract text
        text = self.extract_text_from_pdf(pdf_path)
        if not text:
            return None
        
        print(f"  Extracted {len(text)} characters")
        
        # Extract entities
        if self.nlp:
            entities = self.extract_entities_spacy(text)
        else:
            entities = self.extract_entities_regex(text)
        
        entity_counts = {k: len(v) for k, v in entities.items()}
        print(f"  Found entities: {entity_counts}")
        
        # Store document info
        doc_info = {
            "filename": pdf_path.name,
            "metadata": metadata,
            "text_length": len(text),
            "entities": {k: list(v) for k, v in entities.items()}
        }
        
        self.documents[pdf_path.name] = doc_info
        
        # Add entities to graph
        for entity_type, entity_set in entities.items():
            for entity in entity_set:
                self.entities[entity]["type"] = entity_type
                self.entities[entity]["mentions"] += 1
                self.entities[entity]["documents"].add(pdf_path.name)
        
        # Create relationships from case metadata
        if metadata["case_name"]:
            case_entity = f"{metadata['case_name']} ({metadata['case_number']})"
            self.entities[case_entity]["type"] = "CASE"
            
            # Link case to court
            if metadata["court"]:
                self.relationships.append({
                    "source": case_entity,
                    "target": metadata["court"],
                    "type": "filed_in",
                    "document": pdf_path.name
                })
                self.entities[metadata["court"]]["type"] = "COURT"
        
        return doc_info
    
    def build_graph(self):
        """Build NetworkX graph from entities and relationships."""
        if not NETWORKX_AVAILABLE:
            print("\n⚠ NetworkX not available. Skipping graph construction.")
            return None
        
        G = nx.Graph()
        
        # Add entity nodes
        for entity, data in self.entities.items():
            G.add_node(entity, 
                      type=data["type"],
                      mentions=data["mentions"],
                      doc_count=len(data["documents"]))
        
        # Add relationship edges
        for rel in self.relationships:
            G.add_edge(rel["source"], rel["target"], 
                      type=rel["type"],
                      document=rel["document"])
        
        # Add co-occurrence edges (entities appearing in same document)
        for doc_name, doc_info in self.documents.items():
            all_entities = []
            for entity_list in doc_info["entities"].values():
                all_entities.extend(entity_list)
            
            # Create edges between entities in same document
            for i, e1 in enumerate(all_entities):
                for e2 in all_entities[i+1:]:
                    if e1 != e2:
                        if G.has_edge(e1, e2):
                            G[e1][e2]["weight"] = G[e1][e2].get("weight", 0) + 1
                        else:
                            G.add_edge(e1, e2, weight=1, type="co-occurrence")
        
        return G
    
    def export_to_json(self, output_path: Path):
        """Export knowledge graph to JSON."""
        data = {
            "entities": {
                entity: {
                    "type": data["type"],
                    "mentions": data["mentions"],
                    "documents": list(data["documents"])
                }
                for entity, data in self.entities.items()
            },
            "relationships": self.relationships,
            "documents": self.documents
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"\n✓ Exported knowledge graph to: {output_path}")
    
    def export_to_csv(self, output_dir: Path):
        """Export entities and relationships to CSV files."""
        output_dir.mkdir(exist_ok=True)
        
        # Export entities
        entities_csv = output_dir / "entities.csv"
        with open(entities_csv, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(["entity", "type", "mentions", "document_count"])
            for entity, data in sorted(self.entities.items(), key=lambda x: x[1]["mentions"], reverse=True):
                writer.writerow([
                    entity,
                    data["type"],
                    data["mentions"],
                    len(data["documents"])
                ])
        print(f"✓ Exported entities to: {entities_csv}")
        
        # Export relationships
        relationships_csv = output_dir / "relationships.csv"
        with open(relationships_csv, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(["source", "target", "type", "document"])
            for rel in self.relationships:
                writer.writerow([rel["source"], rel["target"], rel["type"], rel["document"]])
        print(f"✓ Exported relationships to: {relationships_csv}")
        
        # Export document metadata
        docs_csv = output_dir / "documents.csv"
        with open(docs_csv, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(["filename", "case_name", "case_number", "court", "year", "text_length", "entity_count"])
            for doc_name, doc_info in self.documents.items():
                meta = doc_info["metadata"]
                total_entities = sum(len(v) for v in doc_info["entities"].values())
                writer.writerow([
                    doc_name,
                    meta["case_name"],
                    meta["case_number"],
                    meta["court"],
                    meta["year"],
                    doc_info["text_length"],
                    total_entities
                ])
        print(f"✓ Exported documents to: {docs_csv}")
    
    def visualize_network(self, G, output_path: Path, max_nodes=100):
        """Create interactive network visualization with Plotly."""
        if not PLOTLY_AVAILABLE:
            print("\n⚠ Plotly not available. Skipping visualization.")
            return
        
        # Limit to most connected nodes for visualization
        if len(G.nodes()) > max_nodes:
            # Get top nodes by degree
            top_nodes = sorted(G.degree(), key=lambda x: x[1], reverse=True)[:max_nodes]
            node_list = [n for n, d in top_nodes]
            G = G.subgraph(node_list)
            print(f"  Limiting visualization to top {max_nodes} nodes")
        
        # Calculate layout
        pos = nx.spring_layout(G, k=0.5, iterations=50)
        
        # Create edge trace
        edge_trace = go.Scatter(
            x=[],
            y=[],
            line=dict(width=0.5, color='#888'),
            hoverinfo='none',
            mode='lines'
        )
        
        for edge in G.edges():
            x0, y0 = pos[edge[0]]
            x1, y1 = pos[edge[1]]
            edge_trace['x'] += (x0, x1, None)
            edge_trace['y'] += (y0, y1, None)
        
        # Create node trace
        node_trace = go.Scatter(
            x=[],
            y=[],
            text=[],
            mode='markers+text',
            hoverinfo='text',
            marker=dict(
                showscale=True,
                colorscale='YlOrRd',
                size=[],
                color=[],
                colorbar=dict(
                    thickness=15,
                    title='Connections',
                    xanchor='left',
                    titleside='right'
                ),
                line=dict(width=2)
            ),
            textposition="top center",
            textfont=dict(size=8)
        )
        
        # Add nodes
        for node in G.nodes():
            x, y = pos[node]
            node_trace['x'] += (x,)
            node_trace['y'] += (y,)
            
            # Node label (truncate long names)
            label = node if len(node) < 30 else node[:27] + "..."
            node_trace['text'] += (label,)
            
            # Node size based on degree
            node_trace['marker']['size'] += (10 + G.degree(node) * 2,)
            node_trace['marker']['color'] += (G.degree(node),)
        
        # Create figure
        fig = go.Figure(
            data=[edge_trace, node_trace],
            layout=go.Layout(
                title='Court Documents Knowledge Graph',
                titlefont_size=16,
                showlegend=False,
                hovermode='closest',
                margin=dict(b=20, l=5, r=5, t=40),
                annotations=[dict(
                    text="Node size = number of connections",
                    showarrow=False,
                    xref="paper", yref="paper",
                    x=0.005, y=-0.002
                )],
                xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                yaxis=dict(showgrid=False, zeroline=False, showticklabels=False)
            )
        )
        
        fig.write_html(str(output_path))
        print(f"\n✓ Created interactive visualization: {output_path}")


def main():
    """Main execution function."""
    print("="*80)
    print("KNOWLEDGE GRAPH BUILDER - Court Documents Analysis")
    print("="*80)
    
    # Setup
    pdfs_dir = Path("cleaned_pdfs")
    if not pdfs_dir.exists():
        pdfs_dir = Path("pdfs")
    
    if not pdfs_dir.exists():
        print(f"\nError: Directory not found: {pdfs_dir}")
        return 1
    
    # Get PDF files (limit for initial processing)
    pdf_files = list(pdfs_dir.glob("*.pdf"))
    
    if not pdf_files:
        print(f"\nNo PDF files found in {pdfs_dir}")
        return 1
    
    print(f"\nFound {len(pdf_files)} PDF files")
    
    # Ask user if they want to process all or sample
    if len(pdf_files) > 20:
        response = input(f"\nProcess all {len(pdf_files)} files? This may take a while. (y/N): ")
        if response.lower() != 'y':
            print("Processing first 20 files as sample...")
            pdf_files = pdf_files[:20]
    
    # Build knowledge graph
    kg = KnowledgeGraph()
    
    print("\n" + "="*80)
    print("STEP 1: EXTRACTING TEXT AND ENTITIES")
    print("="*80)
    
    for pdf_path in pdf_files:
        kg.process_document(pdf_path)
    
    # Summary
    print("\n" + "="*80)
    print("EXTRACTION SUMMARY")
    print("="*80)
    print(f"Total documents processed: {len(kg.documents)}")
    print(f"Total unique entities: {len(kg.entities)}")
    print(f"Total relationships: {len(kg.relationships)}")
    
    # Entity breakdown
    entity_types = defaultdict(int)
    for data in kg.entities.values():
        entity_types[data["type"]] += 1
    
    print("\nEntity types:")
    for etype, count in sorted(entity_types.items(), key=lambda x: x[1], reverse=True):
        print(f"  {etype}: {count}")
    
    # Step 2: Build graph
    print("\n" + "="*80)
    print("STEP 2: BUILDING KNOWLEDGE GRAPH")
    print("="*80)
    
    G = kg.build_graph()
    
    if G:
        print(f"\n✓ Built graph with {G.number_of_nodes()} nodes and {G.number_of_edges()} edges")
        
        # Graph statistics
        if G.number_of_nodes() > 0:
            print(f"  Average degree: {sum(dict(G.degree()).values()) / G.number_of_nodes():.2f}")
            if nx.is_connected(G):
                print(f"  Graph diameter: {nx.diameter(G)}")
            else:
                components = list(nx.connected_components(G))
                print(f"  Connected components: {len(components)}")
    
    # Step 3: Export and visualize
    print("\n" + "="*80)
    print("STEP 3: EXPORTING AND VISUALIZING")
    print("="*80)
    
    output_dir = Path("knowledge_graph_output")
    output_dir.mkdir(exist_ok=True)
    
    # Export to JSON
    kg.export_to_json(output_dir / "knowledge_graph.json")
    
    # Export to CSV
    kg.export_to_csv(output_dir)
    
    # Create visualization
    if G and PLOTLY_AVAILABLE:
        kg.visualize_network(G, output_dir / "network_visualization.html")
    
    print("\n" + "="*80)
    print("COMPLETE!")
    print("="*80)
    print(f"\nAll outputs saved to: {output_dir.absolute()}")
    print("\nGenerated files:")
    print("  - knowledge_graph.json (full graph data)")
    print("  - entities.csv (entity list)")
    print("  - relationships.csv (relationships)")
    print("  - documents.csv (document metadata)")
    if PLOTLY_AVAILABLE:
        print("  - network_visualization.html (interactive graph)")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
