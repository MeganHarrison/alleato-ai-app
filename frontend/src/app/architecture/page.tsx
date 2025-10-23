"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, Circle, Clock, Database, Bot, Brain, Cloud, FileText, Users, Lock, AlertTriangle, Zap, Building } from "lucide-react";
import { PageHeader } from "@/components/page-header"


export default function ArchitecturePage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div>
      <div className="mb-8">
        <PageHeader 
                  title="System Architecture"
                  description="This system transforms your raw business data into actionable intelligence, helping you make better decisions faster and never miss critical information."
                />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="data-flow">Data Flow</TabsTrigger>
          <TabsTrigger value="status">Status & Roadmap</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  What is This System?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>
                  This is your <strong>AI-Powered Business Intelligence Platform</strong>. Think of it as your company's digital brain that:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Processes and understands all your business documents</li>
                  <li>Extracts actionable insights from meetings and reports</li>
                  <li>Tracks projects, tasks, and financial impacts</li>
                  <li>Provides intelligent chat assistance for decision-making</li>
                  <li>Automatically identifies risks and opportunities</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Who Uses This?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-1">Company Leadership</h4>
                    <p className="text-sm text-muted-foreground">
                      Access executive dashboards, insights summaries, and strategic decision support
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Project Managers</h4>
                    <p className="text-sm text-muted-foreground">
                      Track projects, identify blockers, manage dependencies and timelines
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">All Employees</h4>
                    <p className="text-sm text-muted-foreground">
                      Search documents, get AI assistance, access meeting insights
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="components" className="space-y-6 mt-6">
          <div className="grid gap-6">
            <div>
                <h3 className="text-xl font-semibold">Main System Components</h3>
                <p className="text-sm">
                  Each component serves a specific purpose in your business intelligence ecosystem
                </p>
              <div className="pt-6 space-y-6">
                {/* Frontend */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#0E172A]/10 rounded-lg">
                        <Users className="h-6 w-6 text-[#0E172A]" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Web Interface (Frontend)</h3>
                        <p className="text-sm text-muted-foreground">What you're looking at right now</p>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  <div className="ml-14">

                    <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                      <li>View dashboards and reports</li>
                      <li>Chat with the AI assistant</li>
                      <li>Manage projects and tasks</li>
                      <li>Upload and search documents</li>
                      <li>Access insights and analytics</li>
                    </ul>
                    <div className="mt-3 text-xs">
                      <strong>Technology:</strong> Next.js (React) with TypeScript
                    </div>
                  </div>
                </div>

                {/* AI Agent API */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Bot className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">AI Agent (Backend API)</h3>
                        <p className="text-sm text-muted-foreground">The brain of your system</p>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  <div className="ml-14">
                    <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                      <li>Powers the intelligent chat assistant</li>
                      <li>Answers questions about your business data</li>
                      <li>Provides recommendations and analysis</li>
                      <li>Integrates with multiple AI models (GPT-4, Claude, etc.)</li>
                      <li>Maintains conversation memory and context</li>
                    </ul>
                    <div className="mt-3 text-xs">
                      <strong>Technology:</strong> FastAPI (Python) with Pydantic AI
                    </div>
                  </div>
                </div>

                {/* Document Processing */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Brain className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Document Intelligence Pipeline</h3>
                        <p className="text-sm text-muted-foreground">Processes and understands your documents</p>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  <div className="ml-14">
                    <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                      <li>Automatically processes uploaded documents</li>
                      <li>Extracts key insights, action items, and decisions</li>
                      <li>Identifies financial impacts and risks</li>
                      <li>Detects urgency and critical path items</li>
                      <li>Links insights to projects and stakeholders</li>
                    </ul>
                    <div className="mt-3 text-xs">
                      <strong>Technology:</strong> GPT-4 powered analysis with Python
                    </div>
                  </div>
                </div>

                {/* Database */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Database className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Database System</h3>
                        <p className="text-sm text-muted-foreground">Stores all your business data securely</p>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  <div className="ml-14">
                    <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                      <li>User profiles and permissions</li>
                      <li>Projects, tasks, and timelines</li>
                      <li>Documents and their insights</li>
                      <li>Chat conversations and history</li>
                      <li>Meeting notes and action items</li>
                      <li>Financial data and metrics</li>
                    </ul>
                    <div className="mt-3 text-xs">
                      <strong>Technology:</strong> Supabase (PostgreSQL) with vector search
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="data-flow" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">How Your Data Flows Through the System</CardTitle>
              <CardDescription>
                Understanding the journey of your business information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#0E172A] text-white rounded-full flex items-center justify-center font-semibold">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Document Upload</h4>
                    <p className="text-sm text-muted-foreground">
                      You upload meeting transcripts, reports, or other business documents through the web interface.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#0E172A] text-white rounded-full flex items-center justify-center font-semibold">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">AI Processing</h4>
                    <p className="text-sm text-muted-foreground">
                      The document intelligence pipeline analyzes the content, extracting insights, action items, financial impacts, and key decisions.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#0E172A] text-white rounded-full flex items-center justify-center font-semibold">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Database Storage</h4>
                    <p className="text-sm text-muted-foreground">
                      All extracted information is stored in the secure database, organized by projects, dates, and relevance.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#0E172A] text-white rounded-full flex items-center justify-center font-semibold">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Intelligent Access</h4>
                    <p className="text-sm text-muted-foreground">
                      When you ask questions via chat or view dashboards, the AI agent retrieves and synthesizes relevant information to provide accurate answers.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#0E172A] text-white rounded-full flex items-center justify-center font-semibold">
                    5
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Actionable Output</h4>
                    <p className="text-sm text-muted-foreground">
                      You receive insights, recommendations, and alerts through dashboards, reports, and AI conversations.
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <Lock className="h-4 w-4" />
                <AlertTitle>Data Security</AlertTitle>
                <AlertDescription>
                  All data is encrypted in transit and at rest. Access is controlled through user authentication and role-based permissions.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-6 mt-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">System Status & Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Currently Active Features</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span>AI-powered chat assistant with memory</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span>Document upload and processing</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span>Business insights extraction (GPT-4 powered)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span>Project and task management</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span>Financial impact tracking</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span>User authentication and permissions</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span>Executive dashboards and reporting</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Active AI Integrations</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">OpenAI (GPT-4)</span>
                        <Badge variant="default" className="bg-green-500 text-xs">Active</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Primary AI for insights and chat</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Anthropic (Claude)</span>
                        <Badge variant="secondary" className="text-xs">Available</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Alternative AI model option</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">OpenAI ChatKit</span>
                        <Badge variant="default" className="bg-green-500 text-xs">Active</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Enhanced chat interface</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Mem0 AI</span>
                        <Badge variant="default" className="bg-green-500 text-xs">Active</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Long-term memory system</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Pending Features & Integrations</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-yellow-500" />
                      <div>
                        <span>Google Drive integration</span>
                        <span className="text-sm text-muted-foreground ml-2">(Requires API key configuration)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-yellow-500" />
                      <div>
                        <span>Brave Search API</span>
                        <span className="text-sm text-muted-foreground ml-2">(For web search capabilities)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Circle className="h-5 w-5 text-gray-400" />
                      <div>
                        <span>Notion integration</span>
                        <span className="text-sm text-muted-foreground ml-2">(Roadmap item)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Circle className="h-5 w-5 text-gray-400" />
                      <div>
                        <span>Email notifications</span>
                        <span className="text-sm text-muted-foreground ml-2">(Roadmap item)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Configuration Needed</AlertTitle>
                  <AlertDescription>
                    Some features require API keys or additional configuration. Contact your IT administrator to enable pending integrations.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Infrastructure Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">Deployment Options</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Cloud deployment (Render, Vercel, GCP)</li>
                      <li>• Local deployment (Docker)</li>
                      <li>• Hybrid deployment supported</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Monitoring & Analytics</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Langfuse for AI observability</li>
                      <li>• System health monitoring</li>
                      <li>• Usage analytics and metrics</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}