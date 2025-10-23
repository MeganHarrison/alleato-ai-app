"""
Alleato AI Agent Workflow using OpenAI Agents SDK
Based on the provided TypeScript workflow
"""

import os
import json
import asyncio
from typing import Dict, Any, Optional, List, AsyncIterator
from enum import Enum
from pydantic import BaseModel

# Check if we have the openai-agents package
try:
    from openai.agents import (
        fileSearchTool, 
        webSearchTool, 
        hostedMcpTool, 
        codeInterpreterTool, 
        Agent, 
        AgentInputItem, 
        Runner, 
        withTrace
    )
    AGENTS_SDK_AVAILABLE = True
except ImportError:
    AGENTS_SDK_AVAILABLE = False
    print("OpenAI Agents SDK not available, using fallback implementation")


class OperatingProcedure(str, Enum):
    Q_AND_A = "q-and-a"
    FACT_FINDING = "fact-finding"
    OTHER = "other"


class ClassifySchema(BaseModel):
    operating_procedure: OperatingProcedure


class AllleatoWorkflow:
    """Alleato AI Agent workflow implementation"""
    
    def __init__(self):
        self.workflow_id = os.environ.get("OPENAI_WORKFLOW_ID", "wf_68f9ed871f3881909581687179fba37f01b09bb8edcbabda")
        self.vector_store_id = os.environ.get("OPENAI_VECTOR_STORE_ID", "vs_68f5b97c71e08191a1a36f88d16e745d")
        
        if AGENTS_SDK_AVAILABLE:
            self._setup_agents_sdk()
        else:
            # Fallback to assistant API
            from openai import OpenAI
            self.client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
            self._setup_assistants_fallback()
    
    def _setup_agents_sdk(self):
        """Setup using the new Agents SDK"""
        # Tool definitions
        self.file_search = fileSearchTool([self.vector_store_id])
        
        self.web_search_preview = webSearchTool({
            "searchContextSize": "medium",
            "userLocation": {
                "type": "approximate"
            }
        })
        
        self.mcp = hostedMcpTool({
            "serverLabel": "zapier",
            "allowedTools": [
                "add_tools",
                "edit_tools",
                "microsoft_outlook_reply_to_email",
                "notion_find_page_by_title",
                "notion_retrieve_block_children",
                "notion_get_page_comments",
                "notion_find_database_item",
                "notion_get_page_and_children",
                "notion_archive_database_item",
                "notion_add_comment",
                "notion_create_database_item",
                "notion_create_page",
                "notion_add_content_to_page",
                "notion_restore_database_item",
                "notion_update_database_item",
                "notion_api_request_beta",
                "notion_retrieve_a_page",
                "notion_retrieve_database",
                "microsoft_outlook_add_attendees_to_calendar_event",
                "microsoft_outlook_find_calendar_event",
                "microsoft_outlook_find_a_contact",
                "microsoft_outlook_find_email",
                "microsoft_outlook_create_event",
                "microsoft_outlook_create_contact",
                "microsoft_outlook_create_draft_email",
                "microsoft_outlook_create_draft_reply",
                "microsoft_outlook_delete_contact",
                "microsoft_outlook_delete_event",
                "microsoft_outlook_send_email",
                "microsoft_outlook_update_calendar_event",
                "microsoft_outlook_update_contact",
                "microsoft_outlook_api_request_beta",
                "fireflies_ai_find_recent_meeting",
                "fireflies_ai_find_meeting_by_id",
                "fireflies_ai_find_meeting_by_call_details",
                "fireflies_ai_upload_audio",
                "postgresql_find_row",
                "postgresql_find_rows_via_custom_query",
                "postgresql_find_row_via_custom_query",
                "postgresql_new_row",
                "postgresql_update_row"
            ],
            "authorization": '{"expression":"\\"Njk3YzNjODMtZGZiMC00MzE3LWE4YWItMDQ1NDA3MTNhMzI2OmE1NTA1OTVjLWU5YzctNDM4YS05NGVkLWQzNTE1ODE0OGRiNg==\\"","format":"cel"}',
            "requireApproval": "never",
            "serverUrl": "https://mcp.zapier.com/api/mcp/mcp"
        })
        
        self.code_interpreter = codeInterpreterTool({
            "container": {
                "type": "auto",
                "file_ids": []
            }
        })
        
        # Agent definitions
        self.query_rewrite = Agent({
            "name": "Query rewrite",
            "instructions": "Rewrite the user's question to be more specific and relevant to the knowledge base.",
            "model": "gpt-5",
            "modelSettings": {
                "reasoning": {
                    "effort": "low"
                },
                "store": True
            }
        })
        
        self.classify = Agent({
            "name": "Classify",
            "instructions": "Determine whether the question should use the Q&A or fact-finding process.",
            "model": "gpt-5",
            "outputType": ClassifySchema,
            "modelSettings": {
                "reasoning": {
                    "effort": "low"
                },
                "store": True
            }
        })
        
        self.internal_qa = Agent({
            "name": "Internal Q&A",
            "instructions": "Answer the user's question using the knowledge tools you have on hand (file or web search). Be concise and answer succinctly, using bullet points and summarizing the answer up front",
            "model": "gpt-5",
            "tools": [
                self.file_search,
                self.web_search_preview,
                self.mcp
            ],
            "modelSettings": {
                "reasoning": {
                    "effort": "low"
                },
                "store": True
            }
        })
        
        self.external_fact_finding = Agent({
            "name": "External fact finding",
            "instructions": """Explore external information using the tools you have (web search, file search, code interpreter). 
Analyze any relevant data, checking your work.

Make sure to output a concise answer followed by summarized bullet point of supporting evidence""",
            "model": "gpt-5",
            "tools": [
                self.web_search_preview,
                self.code_interpreter,
                self.mcp
            ],
            "modelSettings": {
                "reasoning": {
                    "effort": "low"
                },
                "store": True
            }
        })
        
        self.agent = Agent({
            "name": "Agent",
            "instructions": "Ask the user to provide more detail so you can help them by either answering their question or running data analysis relevant to their query",
            "model": "gpt-5-chat-latest",
            "modelSettings": {
                "temperature": 1,
                "topP": 1,
                "maxTokens": 2048,
                "store": True
            }
        })
    
    def _setup_assistants_fallback(self):
        """Fallback setup using Assistant API"""
        # Query Rewrite Assistant
        self.query_rewrite_assistant = self.client.beta.assistants.create(
            name="Query rewrite",
            instructions="Rewrite the user's question to be more specific and relevant to the knowledge base.",
            model="gpt-4-turbo-preview",
            tools=[]
        )
        
        # Classify Assistant
        self.classify_assistant = self.client.beta.assistants.create(
            name="Classify",
            instructions="Determine whether the question should use the Q&A or fact-finding process. Respond with JSON: {\"operating_procedure\": \"q-and-a\" | \"fact-finding\" | \"other\"}",
            model="gpt-4-turbo-preview",
            tools=[],
            response_format={"type": "json_object"}
        )
        
        # Internal Q&A Assistant
        self.internal_qa_assistant = self.client.beta.assistants.create(
            name="Internal Q&A",
            instructions="Answer the user's question using the knowledge tools you have on hand (file or web search). Be concise and answer succinctly, using bullet points and summarizing the answer up front",
            model="gpt-4-turbo-preview",
            tools=[
                {"type": "file_search"}
            ],
            tool_resources={
                "file_search": {
                    "vector_store_ids": [self.vector_store_id]
                }
            }
        )
        
        # External Fact Finding Assistant
        self.external_fact_assistant = self.client.beta.assistants.create(
            name="External fact finding",
            instructions="""Explore external information using the tools you have (web search, file search, code interpreter). 
Analyze any relevant data, checking your work.

Make sure to output a concise answer followed by summarized bullet point of supporting evidence""",
            model="gpt-4-turbo-preview",
            tools=[
                {"type": "code_interpreter"}
            ]
        )
        
        # General Agent Assistant
        self.general_agent_assistant = self.client.beta.assistants.create(
            name="Agent",
            instructions="Ask the user to provide more detail so you can help them by either answering their question or running data analysis relevant to their query",
            model="gpt-4-turbo-preview",
            tools=[]
        )
    
    async def run_workflow(self, input_text: str, thread_id: Optional[str] = None) -> AsyncIterator[Dict[str, Any]]:
        """
        Run the workflow and stream results
        """
        if AGENTS_SDK_AVAILABLE:
            async for event in self._run_agents_sdk_workflow(input_text, thread_id):
                yield event
        else:
            async for event in self._run_assistant_workflow(input_text, thread_id):
                yield event
    
    async def _run_agents_sdk_workflow(self, input_text: str, thread_id: Optional[str] = None) -> AsyncIterator[Dict[str, Any]]:
        """Run workflow using new Agents SDK"""
        async def run_with_trace():
            conversation_history: List[AgentInputItem] = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": input_text
                        }
                    ]
                }
            ]
            
            runner = Runner({
                "traceMetadata": {
                    "__trace_source__": "agent-builder",
                    "workflow_id": self.workflow_id
                }
            })
            
            # Query rewrite step
            yield {"type": "step", "step": "query_rewrite", "status": "started"}
            
            query_rewrite_result = await runner.run(
                self.query_rewrite,
                [
                    *conversation_history,
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "input_text",
                                "text": f"Original question: {input_text}"
                            }
                        ]
                    }
                ]
            )
            
            conversation_history.extend([item.rawItem for item in query_rewrite_result.newItems])
            
            if not query_rewrite_result.finalOutput:
                raise Exception("Query rewrite failed")
            
            rewritten_query = query_rewrite_result.finalOutput
            yield {"type": "step", "step": "query_rewrite", "status": "completed", "output": rewritten_query}
            
            # Classify step
            yield {"type": "step", "step": "classify", "status": "started"}
            
            classify_result = await runner.run(
                self.classify,
                [
                    *conversation_history,
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "input_text",
                                "text": f"Question: {rewritten_query}"
                            }
                        ]
                    }
                ]
            )
            
            conversation_history.extend([item.rawItem for item in classify_result.newItems])
            
            if not classify_result.finalOutput:
                raise Exception("Classification failed")
            
            classification = classify_result.finalOutput.operating_procedure
            yield {"type": "step", "step": "classify", "status": "completed", "output": classification}
            
            # Route based on classification
            if classification == "q-and-a":
                yield {"type": "step", "step": "internal_qa", "status": "started"}
                
                qa_result = await runner.run(
                    self.internal_qa,
                    conversation_history
                )
                
                conversation_history.extend([item.rawItem for item in qa_result.newItems])
                
                if qa_result.finalOutput:
                    yield {"type": "content", "content": qa_result.finalOutput}
                
                yield {"type": "step", "step": "internal_qa", "status": "completed"}
                
            elif classification == "fact-finding":
                yield {"type": "step", "step": "external_fact_finding", "status": "started"}
                
                fact_result = await runner.run(
                    self.external_fact_finding,
                    conversation_history
                )
                
                conversation_history.extend([item.rawItem for item in fact_result.newItems])
                
                if fact_result.finalOutput:
                    yield {"type": "content", "content": fact_result.finalOutput}
                
                yield {"type": "step", "step": "external_fact_finding", "status": "completed"}
                
            else:
                yield {"type": "step", "step": "general_agent", "status": "started"}
                
                agent_result = await runner.run(
                    self.agent,
                    conversation_history
                )
                
                conversation_history.extend([item.rawItem for item in agent_result.newItems])
                
                if agent_result.finalOutput:
                    yield {"type": "content", "content": agent_result.finalOutput}
                
                yield {"type": "step", "step": "general_agent", "status": "completed"}
            
            yield {"type": "done", "thread_id": thread_id}
        
        async for event in withTrace("Live - Alleato Internal Knowledge - Supabase", run_with_trace):
            yield event
    
    async def _run_assistant_workflow(self, input_text: str, thread_id: Optional[str] = None) -> AsyncIterator[Dict[str, Any]]:
        """Fallback implementation using Assistant API"""
        # Create or retrieve thread
        if thread_id:
            thread = self.client.beta.threads.retrieve(thread_id)
        else:
            thread = self.client.beta.threads.create()
            thread_id = thread.id
        
        yield {"type": "thread_created", "thread_id": thread_id}
        
        # Add user message
        self.client.beta.threads.messages.create(
            thread_id=thread_id,
            role="user",
            content=input_text
        )
        
        # Step 1: Query Rewrite
        yield {"type": "step", "step": "query_rewrite", "status": "started"}
        
        run = self.client.beta.threads.runs.create(
            thread_id=thread_id,
            assistant_id=self.query_rewrite_assistant.id,
            instructions=f"Original question: {input_text}"
        )
        
        # Wait for completion
        while run.status in ["queued", "in_progress", "cancelling"]:
            await asyncio.sleep(1)
            run = self.client.beta.threads.runs.retrieve(
                thread_id=thread_id,
                run_id=run.id
            )
        
        if run.status != "completed":
            yield {"type": "error", "error": f"Query rewrite failed: {run.status}"}
            return
        
        # Get rewritten query
        messages = self.client.beta.threads.messages.list(thread_id=thread_id)
        rewritten_query = messages.data[0].content[0].text.value
        
        yield {"type": "step", "step": "query_rewrite", "status": "completed", "output": rewritten_query}
        
        # Step 2: Classify
        yield {"type": "step", "step": "classify", "status": "started"}
        
        self.client.beta.threads.messages.create(
            thread_id=thread_id,
            role="user",
            content=f"Question: {rewritten_query}"
        )
        
        run = self.client.beta.threads.runs.create(
            thread_id=thread_id,
            assistant_id=self.classify_assistant.id
        )
        
        while run.status in ["queued", "in_progress", "cancelling"]:
            await asyncio.sleep(1)
            run = self.client.beta.threads.runs.retrieve(
                thread_id=thread_id,
                run_id=run.id
            )
        
        if run.status != "completed":
            yield {"type": "error", "error": f"Classification failed: {run.status}"}
            return
        
        # Get classification
        messages = self.client.beta.threads.messages.list(thread_id=thread_id)
        classify_response = json.loads(messages.data[0].content[0].text.value)
        classification = classify_response.get("operating_procedure", "other")
        
        yield {"type": "step", "step": "classify", "status": "completed", "output": classification}
        
        # Step 3: Route based on classification
        if classification == "q-and-a":
            yield {"type": "step", "step": "internal_qa", "status": "started"}
            assistant_id = self.internal_qa_assistant.id
        elif classification == "fact-finding":
            yield {"type": "step", "step": "external_fact_finding", "status": "started"}
            assistant_id = self.external_fact_assistant.id
        else:
            yield {"type": "step", "step": "general_agent", "status": "started"}
            assistant_id = self.general_agent_assistant.id
        
        # Run the appropriate assistant
        run = self.client.beta.threads.runs.create(
            thread_id=thread_id,
            assistant_id=assistant_id
        )
        
        # Stream the response
        while run.status in ["queued", "in_progress", "cancelling"]:
            await asyncio.sleep(1)
            run = self.client.beta.threads.runs.retrieve(
                thread_id=thread_id,
                run_id=run.id
            )
            
            # Check for any completed tool calls or intermediate outputs
            if run.status == "in_progress":
                yield {"type": "progress", "status": "processing"}
        
        if run.status == "completed":
            # Get the final response
            messages = self.client.beta.threads.messages.list(thread_id=thread_id)
            final_response = messages.data[0].content[0].text.value
            
            yield {"type": "content", "content": final_response}
            yield {"type": "done", "thread_id": thread_id}
        else:
            yield {"type": "error", "error": f"Assistant run failed: {run.status}"}


# Adapter for ChatKit integration
class ChatKitWorkflowAdapter:
    """Adapter to integrate the workflow with ChatKit"""
    
    def __init__(self):
        self.workflow = AllleatoWorkflow()
    
    async def stream_response(self, user_input: str, thread_id: Optional[str] = None) -> AsyncIterator[Dict[str, Any]]:
        """Stream workflow responses in ChatKit-compatible format"""
        try:
            async for event in self.workflow.run_workflow(user_input, thread_id):
                # Convert to ChatKit event format
                if event["type"] == "content":
                    yield {
                        "type": "message",
                        "content": event["content"],
                        "timestamp": None  # Add timestamp if needed
                    }
                elif event["type"] == "step":
                    yield {
                        "type": "status",
                        "step": event["step"],
                        "status": event["status"],
                        "output": event.get("output")
                    }
                elif event["type"] == "thread_created":
                    yield {
                        "type": "thread",
                        "thread_id": event["thread_id"]
                    }
                elif event["type"] == "done":
                    yield {
                        "type": "done",
                        "thread_id": event.get("thread_id")
                    }
                elif event["type"] == "error":
                    yield {
                        "type": "error",
                        "error": event["error"]
                    }
        except Exception as e:
            yield {
                "type": "error",
                "error": str(e)
            }