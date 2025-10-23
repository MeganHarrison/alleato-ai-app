/**
 * ChatKit Demo Page
 * Showcases the ChatKit integration with OpenAI Agent Builder workflow
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatKitHybrid from "@/components/ChatKitHybrid";
import { Bot, Brain, FileSearch, Globe, Shield, Zap } from "lucide-react";

export default function ChatKitDemo() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-4">
          Alleato AI Agent
        </h1>
        <div className="flex justify-start gap-2 flex-wrap">
          <Badge variant="secondary" className="gap-1">
            <Brain className="h-3 w-3" />
            Multi-Agent Workflow
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <FileSearch className="h-3 w-3" />
            Vector Search
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Globe className="h-3 w-3" />
            Web Search
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Zap className="h-3 w-3" />
            Real-time Streaming
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* ChatKit Interface */}
        <div className="lg:col-span-2">
          <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Chat Assistant
              </h3>
              <p className="text-sm mb-4">
                Ask questions about your knowledge base or explore external information
              </p>
            <div className="p-0">
              <ChatKitHybrid className="h-[600px]" />
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="space-y-12">

          {/* Features */}
          <div>
              <h4 className="font-semibold flex items-center mb-2">
                Key Features</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <FileSearch className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Knowledge Base Search</h4>
                    <p className="text-sm text-muted-foreground">
                      Access your organization’s documents and resources
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Web Search Integration</h4>
                    <p className="text-sm text-muted-foreground">
                      Find and analyze external information
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Built-in Safety</h4>
                    <p className="text-sm text-muted-foreground">
                      Guardrails for secure and appropriate responses
                    </p>
                  </div>
                </div>
              </div>
          </div>

          {/* Workflow */}
          <div>
              <h4 className="font-semibold flex items-center mb-2">
                Intelligent Workflow</h4>
              <div className="space-y-4">
                  <div>
                    <p className="font-medium">Query Rewriting</p>
                    <p className="text-sm text-muted-foreground">
                      Optimizes your question for better knowledge base search
                    </p>
                  </div>

                  <div>
                    <p className="font-medium">Smart Classification</p>
                    <p className="text-sm text-muted-foreground">
                      Routes to Q&A or fact-finding based on query type.
                    </p>
                  </div>
                
                  <div>
                    <p className="font-medium">Specialized Response</p>
                    <p className="text-sm text-muted-foreground">
                    Leverages appropriate tools and knowledge sources
                    </p>
                  </div>
                
              </div>
          </div>

        </div>
      </div>

    </div>
  );
}