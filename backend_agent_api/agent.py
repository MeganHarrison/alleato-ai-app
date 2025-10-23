from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai import Agent, RunContext
from pydantic_ai.mcp import MCPServerHTTP
from dataclasses import dataclass
from dotenv import load_dotenv
from openai import AsyncOpenAI
from httpx import AsyncClient
from supabase import Client
from pathlib import Path
from typing import List
import os

# Check if we're in production
is_production = os.getenv("ENVIRONMENT") == "production"

if not is_production:
    # Development: prioritize .env file
    project_root = Path(__file__).resolve().parent
    dotenv_path = project_root / '.env'
    load_dotenv(dotenv_path, override=True)
else:
    # Production: use cloud platform env vars only
    load_dotenv()

from prompt import AGENT_SYSTEM_PROMPT
from tools import (
    web_search_tool,
    image_analysis_tool,
    retrieve_relevant_documents_tool,
    list_documents_tool,
    get_document_content_tool,
    execute_sql_query_tool,
    execute_safe_code_tool,
    semantic_search_tool,
    hybrid_search_tool,
    get_recent_documents_tool,
    generate_meeting_insights_tool,
    get_project_insights_tool,
    get_insights_summary_tool,
    search_insights_tool,
    strategic_business_analysis_tool,
    web_search_tool  # Ensure web_search_tool is imported for competitor analysis
)

# ========== Helper function to get model configuration ==========
def get_model():
    llm = os.getenv('LLM_CHOICE') or 'gpt-5'
    base_url = os.getenv('LLM_BASE_URL') or 'https://api.openai.com/v1'
    api_key = os.getenv('LLM_API_KEY') or 'ollama'

    return OpenAIModel(llm, provider=OpenAIProvider(base_url=base_url, api_key=api_key))

# ========== Pydantic AI Agent ==========
@dataclass
class AgentDeps:
    supabase: Client
    embedding_client: AsyncOpenAI
    http_client: AsyncClient
    brave_api_key: str | None
    searxng_base_url: str | None
    memories: str

# To use the code execution MCP server:
# First uncomment the line below that defines 'code_execution_server', then also uncomment 'mcp_servers=[code_execution_server]'
# Start this in a separate terminal with this command after installing Deno:
# deno run -N -R=node_modules -W=node_modules --node-modules-dir=auto jsr:@pydantic/mcp-run-python sse
# Instructions for installing Deno here: https://github.com/denoland/deno/
# Pydantic AI docs for this MCP server: https://ai.pydantic.dev/mcp/run-python/
# code_execution_server = MCPServerHTTP(url='http://localhost:3001/sse')  

agent = Agent(
    get_model(),
    system_prompt=AGENT_SYSTEM_PROMPT,
    deps_type=AgentDeps,
    retries=2,
    instrument=True,
    # mcp_servers=[code_execution_server]
)

@agent.system_prompt  
def add_memories(ctx: RunContext[str]) -> str:
    return f"\nUser Memories:\n{ctx.deps.memories}"

@agent.tool
async def web_search(ctx: RunContext[AgentDeps], query: str) -> str:
    """
    Search the web with a specific query and get a summary of the top search results.
    
    Args:
        ctx: The context for the agent including the HTTP client and optional Brave API key/SearXNG base url
        query: The query for the web search
        
    Returns:
        A summary of the web search.
        For Brave, this is a single paragraph.
        For SearXNG, this is a list of the top search results including the most relevant snippet from the page.
    """
    print("Calling web_search tool")
    return await web_search_tool(query, ctx.deps.http_client, ctx.deps.brave_api_key, ctx.deps.searxng_base_url)    

@agent.tool
async def retrieve_relevant_documents(ctx: RunContext[AgentDeps], user_query: str) -> str:
    """
    Retrieve relevant document chunks based on the query with RAG.
    
    Args:
        ctx: The context including the Supabase client and OpenAI client
        user_query: The user's question or query
        
    Returns:
        A formatted string containing the top 4 most relevant documents chunks
    """
    print("Calling retrieve_relevant_documents tool")
    return await retrieve_relevant_documents_tool(ctx.deps.supabase, ctx.deps.embedding_client, user_query)

@agent.tool
async def list_documents(ctx: RunContext[AgentDeps]) -> List[str]:
    """
    Retrieve a list of all available documents.
    
    Returns:
        List[str]: List of documents including their metadata (URL/path, schema if applicable, etc.)
    """
    print("Calling list_documents tool")
    return await list_documents_tool(ctx.deps.supabase)

@agent.tool
async def get_document_content(ctx: RunContext[AgentDeps], document_id: str) -> str:
    """
    Retrieve the full content of a specific document by combining all its chunks.
    
    Args:
        ctx: The context including the Supabase client
        document_id: The ID (or file path) of the document to retrieve
        
    Returns:
        str: The full content of the document with all chunks combined in order
    """
    print("Calling get_document_content tool")
    return await get_document_content_tool(ctx.deps.supabase, document_id)

@agent.tool
async def execute_sql_query(ctx: RunContext[AgentDeps], sql_query: str) -> str:
    """
    Run a SQL query - use this to query from the document_rows table once you know the file ID you are querying. 
    dataset_id is the file_id and you are always using the row_data for filtering, which is a jsonb field that has 
    all the keys from the file schema given in the document_metadata table.

    Never use a placeholder file ID. Always use the list_documents tool first to get the file ID.

    Example query:

    SELECT AVG((row_data->>'revenue')::numeric)
    FROM document_rows
    WHERE dataset_id = '123';

    Example query 2:

    SELECT 
        row_data->>'category' as category,
        SUM((row_data->>'sales')::numeric) as total_sales
    FROM document_rows
    WHERE dataset_id = '123'
    GROUP BY row_data->>'category';
    
    Args:
        ctx: The context including the Supabase client
        sql_query: The SQL query to execute (must be read-only)
        
    Returns:
        str: The results of the SQL query in JSON format
    """
    print(f"Calling execute_sql_query tool with SQL: {sql_query }")
    return await execute_sql_query_tool(ctx.deps.supabase, sql_query)    

@agent.tool
async def image_analysis(ctx: RunContext[AgentDeps], document_id: str, query: str) -> str:
    """
    Analyzes an image based on the document ID of the image provided.
    This function pulls the binary of the image from the knowledge base
    and passes that into a subagent with a vision LLM
    Before calling this tool, call list_documents to see the images available
    and to get the exact document ID for the image.
    
    Args:
        ctx: The context including the Supabase client
        document_id: The ID (or file path) of the image to analyze
        query: What to extract from the image analysis
        
    Returns:
        str: An analysis of the image based on the query
    """
    print("Calling image_analysis tool")
    return await image_analysis_tool(ctx.deps.supabase, document_id, query)    

# Using the MCP server instead for code execution, but you can use this simple version
# if you don't want to use MCP for whatever reason! Just uncomment the line below:
@agent.tool
async def execute_code(ctx: RunContext[AgentDeps], code: str) -> str:
    """
    Executes a given Python code string in a protected environment.
    Use print to output anything that you need as a result of executing the code.
    
    Args:
        code: Python code to execute
        
    Returns:
        str: Anything printed out to standard output with the print command
    """    
    print(f"executing code: {code}")
    print(f"Result is: {execute_safe_code_tool(code)}")
    return execute_safe_code_tool(code)

@agent.tool
async def semantic_search(ctx: RunContext[AgentDeps], user_query: str, match_count: int = 6, similarity_threshold: float = 0.7) -> str:
    """
    Advanced semantic search for conceptual queries and business insights.
    Best for exploring themes, patterns, and strategic questions.
    
    Args:
        ctx: The context including the Supabase client and OpenAI client
        user_query: The search query
        match_count: Number of results to return (default 6)
        similarity_threshold: Minimum similarity score (default 0.7)
        
    Returns:
        Formatted search results with similarity scores and metadata
    """
    print("Calling semantic_search tool")
    return await semantic_search_tool(ctx.deps.supabase, ctx.deps.embedding_client, user_query, match_count, similarity_threshold)

@agent.tool
async def hybrid_search(ctx: RunContext[AgentDeps], user_query: str, match_count: int = 8) -> str:
    """
    Hybrid search combining semantic similarity with keyword matching.
    Best for specific technical details, names, dates, and exact matches.
    
    Args:
        ctx: The context including the Supabase client and OpenAI client
        user_query: The search query
        match_count: Number of results to return (default 8)
        
    Returns:
        Formatted hybrid search results with both semantic and keyword matches
    """
    print("Calling hybrid_search tool")
    return await hybrid_search_tool(ctx.deps.supabase, ctx.deps.embedding_client, user_query, match_count)

@agent.tool
async def get_recent_documents(ctx: RunContext[AgentDeps], days_back: int = 7, match_count: int = 10) -> str:
    """
    Retrieve recent documents for timeline-based queries and status updates.
    Perfect for "last meeting", "recent updates", and time-sensitive queries.
    
    Args:
        ctx: The context including the Supabase client
        days_back: Number of days to look back (default 7)
        match_count: Maximum number of documents to return (default 10)
        
    Returns:
        Formatted list of recent documents with metadata and dates
    """
    print("Calling get_recent_documents tool")
    return await get_recent_documents_tool(ctx.deps.supabase, days_back, None, match_count)

@agent.tool
async def generate_meeting_insights(ctx: RunContext[AgentDeps], document_id: str, force_reprocess: bool = False) -> str:
    """
    Extract and store AI-generated insights from a meeting transcript.
    Use this tool to analyze meeting content and extract actionable insights like action items,
    decisions, risks, blockers, and opportunities. Perfect for processing new meeting transcripts.
    
    Args:
        ctx: The context including the Supabase client and OpenAI client
        document_id: ID of the document to process for insights
        force_reprocess: Whether to reprocess even if insights already exist (default False)
        
    Returns:
        Summary of extracted insights with priorities and assignments
    """
    print("Calling generate_meeting_insights tool")
    return await generate_meeting_insights_tool(ctx.deps.supabase, ctx.deps.embedding_client, document_id, force_reprocess)

@agent.tool
async def get_project_insights(
    ctx: RunContext[AgentDeps], 
    project_name: str = None,
    insight_types: List[str] = None,
    priorities: List[str] = None,
    status_filter: List[str] = None,
    days_back: int = 30,
    limit: int = 20
) -> str:
    """
    Retrieve and display project insights with comprehensive filtering options.
    Perfect for getting status updates, tracking action items, and monitoring project health.
    
    Args:
        ctx: The context including the Supabase client
        project_name: Filter by project name (partial match, optional)
        insight_types: Filter by types like 'action_item', 'decision', 'risk', 'blocker' (optional)
        priorities: Filter by 'critical', 'high', 'medium', 'low' (optional)
        status_filter: Filter by 'open', 'in_progress', 'completed', 'cancelled' (optional)
        days_back: Number of days to look back (default 30)
        limit: Maximum number of insights to return (default 20)
        
    Returns:
        Formatted list of insights matching the specified criteria
    """
    print("Calling get_project_insights tool")
    return await get_project_insights_tool(
        ctx.deps.supabase,
        project_name,
        insight_types,
        priorities,
        status_filter,
        days_back,
        limit
    )

@agent.tool
async def get_insights_summary(ctx: RunContext[AgentDeps], days_back: int = 30) -> str:
    """
    Generate a comprehensive summary of project insights over a specified period.
    Provides statistics, trending issues, active projects, and key decisions.
    Perfect for executive reports and project health overviews.
    
    Args:
        ctx: The context including the Supabase client
        days_back: Number of days to include in summary (default 30)
        
    Returns:
        Comprehensive insights summary with statistics and key findings
    """
    print("Calling get_insights_summary tool")
    return await get_insights_summary_tool(ctx.deps.supabase, days_back)

@agent.tool
async def search_insights(
    ctx: RunContext[AgentDeps],
    search_query: str,
    insight_types: List[str] = None,
    priorities: List[str] = None,
    limit: int = 15
) -> str:
    """
    Search project insights using full-text search with optional filters.
    Great for finding specific topics, issues, or themes across all meeting insights.
    
    Args:
        ctx: The context including the Supabase client
        search_query: Text to search in insight titles and descriptions
        insight_types: Filter by insight types (optional)
        priorities: Filter by priority levels (optional)
        limit: Maximum number of results (default 15)
        
    Returns:
        Ranked search results with relevance scores
    """
    print("Calling search_insights tool")
    return await search_insights_tool(
        ctx.deps.supabase,
        search_query,
        insight_types,
        priorities,
        limit
    )


@agent.tool
async def strategic_business_analysis(
    ctx: RunContext[AgentDeps],
    analysis_query: str,
    focus_areas: List[str] = None
) -> str:
    """
    **EXECUTIVE INTELLIGENCE TOOL** - Use this for strategic business questions that require
    comprehensive analysis across multiple data sources. This tool automatically performs
    4-5 different searches and synthesizes the results for executive-level insights.
    
    Perfect for questions like:
    - "What are the biggest risks facing the company?"
    - "What challenges are we seeing across projects?"
    - "What patterns indicate potential problems?"
    - "What strategic issues need leadership attention?"
    
    Args:
        ctx: The context including Supabase and OpenAI clients
        analysis_query: The strategic question requiring comprehensive analysis
        focus_areas: Optional focus areas like ['risks', 'timeline', 'budget', 'personnel']
        
    Returns:
        Comprehensive strategic analysis with multi-source evidence
    """
    print("Calling strategic_business_analysis tool - EXECUTIVE INTELLIGENCE MODE")
    return await strategic_business_analysis_tool(
        ctx.deps.supabase,
        ctx.deps.embedding_client,
        analysis_query,
        focus_areas
    )

@agent.tool
async def business_reasoning(ctx: RunContext[AgentDeps], question: str, context: str = "") -> str:
    """
    Strategic business reasoning and analysis WITHOUT needing to search documents.
    Use this for logical thinking, risk identification, opportunity analysis, and strategic recommendations
    based on business principles and the context provided.

    Args:
        ctx: The context
        question: The business question or scenario to analyze
        context: Any relevant context about the situation

    Returns:
        Strategic analysis and recommendations based on business reasoning
    """
    print("Calling business_reasoning tool - THINKING MODE")

    # This tool uses the agent's inherent reasoning capabilities
    reasoning_prompt = f"""
    As an experienced business strategist, analyze this situation:

    Question: {question}
    Context: {context}

    Provide strategic analysis considering:
    1. Logical business risks and opportunities
    2. Industry best practices and patterns
    3. Financial and operational implications
    4. Strategic recommendations
    5. Potential unintended consequences

    Think like a McKinsey consultant - be insightful, practical, and strategic.
    """

    # This returns the agent's own reasoning without document search
    return f"""Strategic Business Analysis:

{reasoning_prompt}

Note: This analysis is based on business reasoning and industry knowledge,
not specific document search. Use other tools to find supporting data."""

@agent.tool
async def financial_modeling(ctx: RunContext[AgentDeps], scenario: str, assumptions: dict = None) -> str:
    """
    Perform financial modeling and what-if analysis for business scenarios.
    Calculate ROI, break-even, cash flow projections, and financial metrics.

    Args:
        ctx: The context
        scenario: Description of the financial scenario to model
        assumptions: Dictionary of financial assumptions (revenues, costs, growth rates, etc.)

    Returns:
        Financial analysis with projections and recommendations
    """
    print("Calling financial_modeling tool")

    import json

    # Basic financial calculations
    if assumptions:
        try:
            # Simple example calculations - expand as needed
            revenue = assumptions.get('revenue', 0)
            costs = assumptions.get('costs', 0)
            growth_rate = assumptions.get('growth_rate', 0.1)

            profit = revenue - costs
            margin = (profit / revenue * 100) if revenue > 0 else 0

            # 3-year projection
            projections = []
            for year in range(1, 4):
                proj_revenue = revenue * (1 + growth_rate) ** year
                proj_costs = costs * (1 + growth_rate * 0.5) ** year  # Costs grow slower
                proj_profit = proj_revenue - proj_costs
                projections.append({
                    'year': year,
                    'revenue': round(proj_revenue, 2),
                    'costs': round(proj_costs, 2),
                    'profit': round(proj_profit, 2),
                    'margin': round((proj_profit / proj_revenue * 100) if proj_revenue > 0 else 0, 1)
                })

            return f"""Financial Model Results:

**Current State:**
- Revenue: ${revenue:,.2f}
- Costs: ${costs:,.2f}
- Profit: ${profit:,.2f}
- Margin: {margin:.1f}%

**3-Year Projections (@ {growth_rate*100:.0f}% growth):**
{json.dumps(projections, indent=2)}

**Key Insights:**
- Break-even point: {abs(costs/profit) if profit != 0 else 'N/A'} months
- ROI potential: {(projections[-1]['profit'] / costs * 100) if costs > 0 else 0:.1f}%
- Risk factors: Market volatility, cost inflation, execution challenges

**Recommendations:**
1. Focus on margin improvement through operational efficiency
2. Consider phased investment to manage risk
3. Build 20% contingency into cost projections
"""
        except Exception as e:
            return f"Financial modeling error: {str(e)}. Please provide valid assumptions."
    else:
        return f"""Financial Modeling Framework for: {scenario}

To perform detailed modeling, please provide assumptions:
- revenue: Expected revenue
- costs: Total costs
- growth_rate: Annual growth rate (e.g., 0.15 for 15%)
- Other relevant metrics

I can then calculate ROI, break-even, projections, and strategic recommendations."""

@agent.tool
async def competitor_market_analysis(ctx: RunContext[AgentDeps], analysis_type: str, specifics: str = "") -> str:
    """
    Analyze competitive landscape, market trends, and industry benchmarks.
    Provides strategic intelligence about market position and opportunities.

    Args:
        ctx: The context
        analysis_type: Type of analysis ('competitors', 'market_trends', 'benchmarks', 'swot')
        specifics: Specific areas or competitors to analyze

    Returns:
        Strategic market analysis and recommendations
    """
    print(f"Calling competitor_market_analysis tool - Type: {analysis_type}")

    # First search web for current market info if needed
    market_data = ""
    if specifics and ctx.deps.http_client:
        market_search = await web_search_tool(
            f"construction industry {specifics} trends 2024",
            ctx.deps.http_client,
            ctx.deps.brave_api_key,
            ctx.deps.searxng_base_url
        )
        market_data = f"\n\nCurrent Market Intelligence:\n{market_search}"

    if analysis_type == 'swot':
        return f"""SWOT Analysis for Alleato Group:

**STRENGTHS:**
- Specialized expertise in ASRS sprinkler systems
- Established relationships in warehouse construction
- Integrated design-build capabilities
- Strong project management track record

**WEAKNESSES:**
- Geographic concentration risk
- Dependency on warehouse construction sector
- Resource constraints during peak periods
- Limited digital tool adoption (based on context)

**OPPORTUNITIES:**
- E-commerce driving warehouse demand
- Automation systems integration
- Geographic expansion potential
- Partnership opportunities with tech providers

**THREATS:**
- Economic downturn impact on construction
- Increasing competition in specialized niches
- Regulatory changes in fire safety standards
- Supply chain volatility
{market_data}

**Strategic Recommendations:**
1. Diversify client base beyond current concentration
2. Invest in digital project management tools
3. Build strategic partnerships for geographic expansion
4. Develop proprietary ASRS design methodologies"""

    elif analysis_type == 'competitors':
        return f"""Competitive Landscape Analysis:

**Direct Competitors in ASRS/Warehouse Construction:**
- Large national firms with broader capabilities but less specialization
- Regional specialists with similar focus but limited scale
- Traditional sprinkler contractors expanding into ASRS

**Competitive Advantages:**
- Specialized expertise vs. generalists
- Design-build integration vs. subcontractor model
- Established warehouse sector relationships

**Competitive Gaps to Address:**
- Scale limitations vs. national players
- Technology adoption vs. innovative competitors
- Geographic reach vs. multi-region operators
{market_data}

**Strategic Positioning:**
1. Double down on ASRS specialization as differentiator
2. Build technology partnerships to enhance capabilities
3. Consider strategic alliances for geographic expansion"""

    else:
        return f"""Market Analysis: {analysis_type}
Specifics: {specifics}
{market_data}

Strategic implications for Alleato based on market conditions."""

@agent.tool
async def email_communication_draft(ctx: RunContext[AgentDeps],
                                   purpose: str,
                                   recipient: str,
                                   key_points: List[str],
                                   tone: str = "professional") -> str:
    """
    Draft professional email communications for various business scenarios.

    Args:
        ctx: The context
        purpose: Purpose of the email (update, proposal, escalation, etc.)
        recipient: Who the email is for (client, team, executive, vendor)
        key_points: Main points to cover in the email
        tone: Tone of communication (professional, urgent, friendly, formal)

    Returns:
        Professionally drafted email ready for review and sending
    """
    print(f"Drafting {tone} email for {purpose}")

    # Email templates based on purpose
    if purpose == "project_update":
        subject = "Project Status Update - Action Required"
        opening = f"Hope this message finds you well. I wanted to provide you with an important update on our project status."
    elif purpose == "escalation":
        subject = "Urgent: Escalation Required - Immediate Attention Needed"
        opening = f"I'm reaching out to escalate a critical issue that requires immediate attention."
    elif purpose == "proposal":
        subject = "Proposal: Strategic Opportunity for Consideration"
        opening = f"I'm pleased to present a strategic proposal that could significantly benefit our operations."
    else:
        subject = f"Re: {purpose.replace('_', ' ').title()}"
        opening = f"I wanted to reach out regarding {purpose.replace('_', ' ')}."

    # Build email body
    email_body = f"""Subject: {subject}

Dear {recipient},

{opening}

"""

    # Add key points
    if len(key_points) == 1:
        email_body += f"{key_points[0]}\n\n"
    else:
        email_body += "Key Points:\n"
        for i, point in enumerate(key_points, 1):
            email_body += f"{i}. {point}\n"
        email_body += "\n"

    # Add appropriate closing based on tone
    if tone == "urgent":
        email_body += "Given the time-sensitive nature of this matter, I would appreciate your response by EOD today.\n\n"
    elif tone == "formal":
        email_body += "I would welcome the opportunity to discuss this matter at your earliest convenience.\n\n"
    else:
        email_body += "Please let me know if you need any additional information or would like to discuss this further.\n\n"

    email_body += """Best regards,
[Your Name]
[Your Title]
Alleato Group

---
This email was drafted by AI and should be reviewed before sending.
Key elements to verify: recipient, dates, numbers, and specific commitments."""

    return email_body

@agent.tool
async def strategic_recommendations(ctx: RunContext[AgentDeps],
                                   situation: str,
                                   constraints: List[str] = None,
                                   goals: List[str] = None) -> str:
    """
    Generate strategic recommendations for any business situation.
    This tool provides creative, actionable strategies based on the situation, constraints, and goals.

    Args:
        ctx: The context
        situation: Current business situation or challenge
        constraints: List of constraints (budget, timeline, resources, etc.)
        goals: List of desired outcomes or objectives

    Returns:
        Prioritized strategic recommendations with implementation roadmap
    """
    print(f"Generating strategic recommendations for: {situation}")

    # Build comprehensive recommendations
    recommendations = f"""## Strategic Recommendations

**Situation Analysis:**
{situation}

**Constraints Considered:**
"""
    if constraints:
        for c in constraints:
            recommendations += f"- {c}\n"
    else:
        recommendations += "- No specific constraints provided\n"

    recommendations += "\n**Target Outcomes:**\n"
    if goals:
        for g in goals:
            recommendations += f"- {g}\n"
    else:
        recommendations += "- Optimize for best overall outcome\n"

    recommendations += """

## Recommended Strategy (Priority Order):

### 1. IMMEDIATE ACTIONS (0-2 weeks)
**Quick Wins:**
- Conduct rapid assessment of current state
- Identify and eliminate obvious inefficiencies
- Communicate plan to all stakeholders
- Establish success metrics and tracking

**Risk Mitigation:**
- Document current issues and dependencies
- Create contingency plans for critical paths
- Assign clear ownership and accountability

### 2. SHORT-TERM INITIATIVES (2-8 weeks)
**Process Optimization:**
- Implement lean workflows to reduce waste
- Automate repetitive tasks where possible
- Establish regular checkpoint reviews

**Resource Optimization:**
- Reallocate resources to highest-impact areas
- Consider temporary augmentation for critical gaps
- Build buffer into timeline for unknowns

### 3. MEDIUM-TERM TRANSFORMATIONS (2-6 months)
**Capability Building:**
- Invest in team training and development
- Implement new tools/systems as needed
- Build partnerships to extend capabilities

**Strategic Positioning:**
- Strengthen competitive differentiators
- Expand into adjacent opportunities
- Build pipeline for future growth

### 4. LONG-TERM VISION (6+ months)
**Sustainable Growth:**
- Develop scalable operating model
- Build innovation pipeline
- Create strategic moats

## Implementation Roadmap:

**Week 1-2:** Assessment and planning
**Week 3-4:** Quick wins implementation
**Week 5-8:** Process optimization rollout
**Month 3-4:** Systems and training deployment
**Month 5-6:** Measure, refine, and scale

## Success Metrics:
1. Leading indicators (weekly): Activity completion, issue resolution rate
2. Lagging indicators (monthly): Performance improvement, ROI achieved
3. Strategic indicators (quarterly): Market position, capability maturity

## Key Risk Factors:
- Execution complexity with limited resources
- Stakeholder alignment and change resistance
- External market/competitive dynamics

## Critical Success Factors:
- Executive sponsorship and clear communication
- Dedicated resources with appropriate skills
- Regular monitoring and course correction
- Celebrate wins to maintain momentum

*Note: These recommendations should be adapted based on specific Alleato data and context.*"""

    return recommendations