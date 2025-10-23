"""
Python implementation of the OpenAI Agent Builder workflow for Alleato Internal Knowledge Base
Converted from TypeScript export to work with ChatKit integration
"""

from openai import OpenAI
from openai.types.beta.threads import Message
from typing import Optional, Dict, Any, AsyncIterator, List
import os
import json
from enum import Enum
from pydantic import BaseModel


class OperatingProcedure(str, Enum):
    Q_AND_A = "q-and-a"
    FACT_FINDING = "fact-finding"
    OTHER = "other"


class ClassifyOutput(BaseModel):
    operating_procedure: OperatingProcedure


class OpenAIAgentWorkflow:
    def __init__(self):
        self.client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        self.workflow_id = "wf_68f5b95097a48190bbe9a18f90d82ff303018492b05d4c6f"
        
        # Vector store ID from the original workflow
        self.vector_store_id = "vs_68f5b97c71e08191a1a36f88d16e745d"
        
        # Initialize assistants (equivalent to Agents in the SDK)
        self.setup_assistants()
    
    def setup_assistants(self):
        """Create or retrieve assistants for each step of the workflow"""
        
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
                {"type": "file_search"},
                {"type": "web_search"}  # Note: Web search requires additional setup
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
                {"type": "web_search"},
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
    
    async def run_workflow(self, user_input: str, thread_id: Optional[str] = None) -> AsyncIterator[Dict[str, Any]]:
        """
        Run the complete workflow with streaming responses
        """
        # Create or retrieve thread
        if thread_id:
            thread = self.client.beta.threads.retrieve(thread_id)
        else:
            thread = self.client.beta.threads.create()
        
        # Add user message to thread
        self.client.beta.threads.messages.create(
            thread_id=thread.id,
            role="user",
            content=user_input
        )
        
        try:
            # Step 1: Query Rewrite
            yield {"type": "step", "name": "Query Rewrite", "status": "started"}
            
            rewritten_query = await self._run_assistant_step(
                assistant_id=self.query_rewrite_assistant.id,
                thread_id=thread.id,
                additional_instructions=f"Original question: {user_input}"
            )
            
            yield {"type": "step", "name": "Query Rewrite", "status": "completed", "output": rewritten_query}
            
            # Step 2: Classify
            yield {"type": "step", "name": "Classification", "status": "started"}
            
            classification_result = await self._run_assistant_step(
                assistant_id=self.classify_assistant.id,
                thread_id=thread.id,
                additional_instructions=f"Question: {rewritten_query}"
            )
            
            # Parse classification result
            try:
                classification = json.loads(classification_result)
                operating_procedure = classification.get("operating_procedure", "other")
            except:
                operating_procedure = "other"
            
            yield {"type": "step", "name": "Classification", "status": "completed", "output": operating_procedure}
            
            # Step 3: Route based on classification
            if operating_procedure == "q-and-a":
                yield {"type": "step", "name": "Internal Q&A", "status": "started"}
                
                final_answer = await self._run_assistant_step(
                    assistant_id=self.internal_qa_assistant.id,
                    thread_id=thread.id
                )
                
                yield {"type": "step", "name": "Internal Q&A", "status": "completed"}
                
            elif operating_procedure == "fact-finding":
                yield {"type": "step", "name": "External Fact Finding", "status": "started"}
                
                final_answer = await self._run_assistant_step(
                    assistant_id=self.external_fact_assistant.id,
                    thread_id=thread.id
                )
                
                yield {"type": "step", "name": "External Fact Finding", "status": "completed"}
                
            else:
                yield {"type": "step", "name": "General Response", "status": "started"}
                
                final_answer = await self._run_assistant_step(
                    assistant_id=self.general_agent_assistant.id,
                    thread_id=thread.id
                )
                
                yield {"type": "step", "name": "General Response", "status": "completed"}
            
            # Yield final answer
            yield {
                "type": "final_answer",
                "content": final_answer,
                "thread_id": thread.id
            }
            
        except Exception as e:
            yield {"type": "error", "message": str(e)}
    
    async def _run_assistant_step(
        self, 
        assistant_id: str, 
        thread_id: str, 
        additional_instructions: Optional[str] = None
    ) -> str:
        """
        Run a single assistant step and return the response
        """
        # Create run
        run = self.client.beta.threads.runs.create(
            thread_id=thread_id,
            assistant_id=assistant_id,
            additional_instructions=additional_instructions
        )
        
        # Wait for completion
        while run.status in ["queued", "in_progress"]:
            run = self.client.beta.threads.runs.retrieve(
                thread_id=thread_id,
                run_id=run.id
            )
            await asyncio.sleep(0.5)
        
        if run.status == "completed":
            # Get messages
            messages = self.client.beta.threads.messages.list(
                thread_id=thread_id,
                order="desc",
                limit=1
            )
            
            if messages.data:
                return messages.data[0].content[0].text.value
        
        raise Exception(f"Assistant run failed with status: {run.status}")


# For ChatKit integration
import asyncio
from typing import AsyncIterator
from datetime import datetime


class ChatKitWorkflowAdapter:
    """
    Adapter to make the OpenAI workflow compatible with ChatKit
    """
    def __init__(self):
        self.workflow = OpenAIAgentWorkflow()
    
    async def stream_response(
        self, 
        user_input: str, 
        thread_id: Optional[str] = None
    ) -> AsyncIterator[Dict[str, Any]]:
        """
        Stream responses in ChatKit-compatible format
        """
        async for event in self.workflow.run_workflow(user_input, thread_id):
            if event["type"] == "step":
                # Convert to ChatKit progress event
                yield {
                    "type": "progress",
                    "name": event["name"],
                    "status": event["status"],
                    "timestamp": datetime.utcnow().isoformat()
                }
            
            elif event["type"] == "final_answer":
                # Convert to ChatKit message event
                yield {
                    "type": "message",
                    "role": "assistant",
                    "content": event["content"],
                    "thread_id": event["thread_id"],
                    "timestamp": datetime.utcnow().isoformat()
                }
            
            elif event["type"] == "error":
                yield {
                    "type": "error",
                    "error": event["message"],
                    "timestamp": datetime.utcnow().isoformat()
                }