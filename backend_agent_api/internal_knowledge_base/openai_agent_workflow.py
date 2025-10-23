import { fileSearchTool, webSearchTool, hostedMcpTool, codeInterpreterTool, Agent, AgentInputItem, Runner, withTrace } from "@openai/agents";
import { z } from "zod";


// Tool definitions
const fileSearch = fileSearchTool([
  "vs_68f5b97c71e08191a1a36f88d16e745d"
])
const webSearchPreview = webSearchTool({
  searchContextSize: "medium",
  userLocation: {
    type: "approximate"
  }
})
const mcp = hostedMcpTool({
  serverLabel: "zapier",
  serverUrl: "https://mcp.zapier.com/api/mcp/mcp",
  authorization: "{\"expression\":\"\\"Njk3YzNjODMtZGZiMC00MzE3LWE4YWItMDQ1NDA3MTNhMzI2OmE1NTA1OTVjLWU5YzctNDM4YS05NGVkLWQzNTE1ODE0OGRiNg==\\"\",\"format\":\"cel\"}",
  allowedTools: [
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
  requireApproval: "never"
})
const codeInterpreter = codeInterpreterTool({
  container: {
    type: "auto",
    file_ids: []
  }
})
const ClassifySchema = z.object({ operating_procedure: z.enum(["q-and-a", "fact-finding", "other"]) });
const queryRewrite = new Agent({
  name: "Query rewrite",
  instructions: "Rewrite the user's question to be more specific and relevant to the knowledge base.",
  model: "gpt-5",
  modelSettings: {
    reasoning: {
      effort: "low"
    },
    store: true
  }
});

const classify = new Agent({
  name: "Classify",
  instructions: "Determine whether the question should use the Q&A or fact-finding process.",
  model: "gpt-5",
  outputType: ClassifySchema,
  modelSettings: {
    reasoning: {
      effort: "low"
    },
    store: true
  }
});

const internalQA = new Agent({
  name: "Internal Q&A",
  instructions: "Answer the user's question using the knowledge tools you have on hand (file or web search). Be concise and answer succinctly, using bullet points and summarizing the answer up front",
  model: "gpt-5",
  tools: [
    fileSearch,
    webSearchPreview,
    mcp
  ],
  modelSettings: {
    reasoning: {
      effort: "low"
    },
    store: true
  }
});

const externalFactFinding = new Agent({
  name: "External fact finding",
  instructions: `Explore external information using the tools you have (web search, file search, code interpreter). 
Analyze any relevant data, checking your work.

Make sure to output a concise answer followed by summarized bullet point of supporting evidence`,
  model: "gpt-5",
  tools: [
    webSearchPreview,
    codeInterpreter,
    mcp
  ],
  modelSettings: {
    reasoning: {
      effort: "low"
    },
    store: true
  }
});

const agent = new Agent({
  name: "Agent",
  instructions: "Ask the user to provide more detail so you can help them by either answering their question or running data analysis relevant to their query",
  model: "gpt-5-chat-latest",
  modelSettings: {
    temperature: 1,
    topP: 1,
    maxTokens: 2048,
    store: true
  }
});

type WorkflowInput = { input_as_text: string };


// Main code entrypoint
export const runWorkflow = async (workflow: WorkflowInput) => {
  return await withTrace("Alleato Internal Knowledge Base Agent", async () => {
    const state = {

    };
    const conversationHistory: AgentInputItem[] = [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: workflow.input_as_text
          }
        ]
      }
    ];
    const runner = new Runner({
      traceMetadata: {
        __trace_source__: "agent-builder",
        workflow_id: "wf_68f5b95097a48190bbe9a18f90d82ff303018492b05d4c6f"
      }
    });
    const queryRewriteResultTemp = await runner.run(
      queryRewrite,
      [
        ...conversationHistory,
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Original question: ${workflow.input_as_text}`
            }
          ]
        }
      ]
    );
    conversationHistory.push(...queryRewriteResultTemp.newItems.map((item) => item.rawItem));

    if (!queryRewriteResultTemp.finalOutput) {
        throw new Error("Agent result is undefined");
    }

    const queryRewriteResult = {
      output_text: queryRewriteResultTemp.finalOutput ?? ""
    };
    const classifyResultTemp = await runner.run(
      classify,
      [
        ...conversationHistory,
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Question: ${queryRewriteResult.output_text}`
            }
          ]
        }
      ]
    );
    conversationHistory.push(...classifyResultTemp.newItems.map((item) => item.rawItem));

    if (!classifyResultTemp.finalOutput) {
        throw new Error("Agent result is undefined");
    }

    const classifyResult = {
      output_text: JSON.stringify(classifyResultTemp.finalOutput),
      output_parsed: classifyResultTemp.finalOutput
    };
    if (classifyResult.output_parsed.operating_procedure == "q-and-a") {
      const internalQAResultTemp = await runner.run(
        internalQA,
        [
          ...conversationHistory
        ]
      );
      conversationHistory.push(...internalQAResultTemp.newItems.map((item) => item.rawItem));

      if (!internalQAResultTemp.finalOutput) {
          throw new Error("Agent result is undefined");
      }

      const internalQAResult = {
        output_text: internalQAResultTemp.finalOutput ?? ""
      };
    } else if (classifyResult.output_parsed.operating_procedure == "fact-finding") {
      const externalFactFindingResultTemp = await runner.run(
        externalFactFinding,
        [
          ...conversationHistory
        ]
      );
      conversationHistory.push(...externalFactFindingResultTemp.newItems.map((item) => item.rawItem));

      if (!externalFactFindingResultTemp.finalOutput) {
          throw new Error("Agent result is undefined");
      }

      const externalFactFindingResult = {
        output_text: externalFactFindingResultTemp.finalOutput ?? ""
      };
    } else {
      const agentResultTemp = await runner.run(
        agent,
        [
          ...conversationHistory
        ]
      );
      conversationHistory.push(...agentResultTemp.newItems.map((item) => item.rawItem));

      if (!agentResultTemp.finalOutput) {
          throw new Error("Agent result is undefined");
      }

      const agentResult = {
        output_text: agentResultTemp.finalOutput ?? ""
      };
    }
  });
}
