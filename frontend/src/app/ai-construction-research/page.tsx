import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Brain, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Target,
  Shield,
  Lightbulb,
  ChevronRight
} from "lucide-react"

export default function AIConstructionResearchPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-4 py-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          AI in Commercial Construction
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Strategic Analysis for Alleato: How mid-sized design-build firms can leapfrog competitors through systematic AI adoption
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Badge variant="secondary" className="text-base px-4 py-2">
            <Clock className="mr-2 h-4 w-4" />
            18-24 Month Roadmap
          </Badge>
          <Badge variant="secondary" className="text-base px-4 py-2">
            <DollarSign className="mr-2 h-4 w-4" />
            $975K-1.5M First Year Investment
          </Badge>
          <Badge variant="secondary" className="text-base px-4 py-2">
            <TrendingUp className="mr-2 h-4 w-4" />
            20-30% Productivity Gains
          </Badge>
        </div>
      </section>

      <Separator />

      {/* Executive Summary */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Executive Summary</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 border-l-4 border-l-blue-500">
            <h3 className="text-xl font-semibold mb-2">The Opportunity</h3>
            <p className="text-muted-foreground">
              94% of firms report using AI tools, yet 45% have no actual implementation. This maturity gap creates a narrow window for mid-sized design-build firms like Alleato to leapfrog competitors.
            </p>
          </Card>
          <Card className="p-6 border-l-4 border-l-orange-500">
            <h3 className="text-xl font-semibold mb-2">The Urgency</h3>
            <p className="text-muted-foreground">
              By 2027, AI capabilities will be table stakes for commercial construction bids. The 2-5 year lead of top competitors creates structural disadvantages that compound over time.
            </p>
          </Card>
        </div>
        <Card className="p-8 bg-muted/30">
          <blockquote className="text-lg italic">
            "The strategic imperative is decisive action now—not because Alleato must be first but because being in the middle of the pack by 2027 requires starting comprehensive implementation in 2025."
          </blockquote>
        </Card>
      </section>

      {/* Key Statistics */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Industry AI Adoption at a Glance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 text-center">
            <div className="text-4xl font-bold text-blue-600">94%</div>
            <p className="text-sm text-muted-foreground mt-2">of construction firms report using AI tools</p>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-4xl font-bold text-orange-600">45%</div>
            <p className="text-sm text-muted-foreground mt-2">have no actual implementation</p>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-4xl font-bold text-green-600">1.5%</div>
            <p className="text-sm text-muted-foreground mt-2">use AI across multiple processes</p>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-4xl font-bold text-purple-600">$22.68B</div>
            <p className="text-sm text-muted-foreground mt-2">projected market size by 2032</p>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-4xl font-bold text-red-600">382,000</div>
            <p className="text-sm text-muted-foreground mt-2">monthly job openings in construction</p>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-4xl font-bold text-indigo-600">24.6%</div>
            <p className="text-sm text-muted-foreground mt-2">CAGR growth rate (2024-2032)</p>
          </Card>
        </div>
      </section>

      {/* Competitor Analysis */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Building2 className="h-8 w-8" />
          Competitive Landscape
        </h2>
        <p className="text-lg text-muted-foreground">
          Major competitors have invested 2-5 years developing AI capabilities, achieving $25-32 million in project savings, 20-30% productivity gains, and 20% accident reductions.
        </p>
        <div className="space-y-4">
          {[
            {
              company: "Turner Construction",
              highlights: ["$50M annual savings", "30% project delay reductions", "AI Innovation Challenge with OpenAI"],
              investment: "5+ years, dedicated AI leadership"
            },
            {
              company: "Suffolk Construction",
              highlights: ["$110M venture capital arm", "30+ portfolio companies", "Fast follower philosophy"],
              investment: "Suffolk Technologies ecosystem"
            },
            {
              company: "Skanska USA",
              highlights: ["Skanska Sidekick suite", "3,000+ employees using AI", "Proprietary tools"],
              investment: "5+ years data strategy"
            },
            {
              company: "Gilbane",
              highlights: ["Seven-figure Trunk Tools deal", "65% rework reduction", "$2,500-4,000 savings per project"],
              investment: "National AI deployment"
            }
          ].map((competitor, index) => (
            <Card key={index} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">{competitor.company}</h3>
                <Badge variant="secondary">{competitor.investment}</Badge>
              </div>
              <ul className="space-y-2">
                {competitor.highlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">{highlight}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* AI Use Cases by Maturity */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Brain className="h-8 w-8" />
          Strategic AI Use Cases by Maturity
        </h2>
        
        {/* Tier 1 */}
        <Card className="p-6 border-2 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-semibold">Tier 1: Proven ROI - Deploy Immediately</h3>
            <Badge className="bg-green-500">High Maturity</Badge>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="space-y-2">
              <h4 className="font-semibold">Document Management</h4>
              <p className="text-sm text-muted-foreground">57% faster submittal processing</p>
              <p className="text-xs">Autodesk Construction IQ trusted 5M+ times</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Cost Estimation</h4>
              <p className="text-sm text-muted-foreground">$1M first-year savings (Coastal)</p>
              <p className="text-xs">97% accuracy, 80% time reduction</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Safety Monitoring</h4>
              <p className="text-sm text-muted-foreground">20% accident reduction</p>
              <p className="text-xs">95% OSHA risk identification accuracy</p>
            </div>
          </div>
        </Card>

        {/* Tier 2 */}
        <Card className="p-6 border-2 border-yellow-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-semibold">Tier 2: Emerging - Deploy in Year 2</h3>
            <Badge className="bg-yellow-500">Medium Maturity</Badge>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="space-y-2">
              <h4 className="font-semibold">Schedule Optimization</h4>
              <p className="text-sm text-muted-foreground">$25-32M project savings</p>
              <p className="text-xs">ALICE Technologies proven results</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Progress Tracking</h4>
              <p className="text-sm text-muted-foreground">50% delay reduction</p>
              <p className="text-xs">95% accurate reports in minutes</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">BIM Integration</h4>
              <p className="text-sm text-muted-foreground">25-30% design efficiency</p>
              <p className="text-xs">Generative design optimization</p>
            </div>
          </div>
        </Card>

        {/* Tier 3 */}
        <Card className="p-6 border-2 border-gray-400">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-semibold">Tier 3: Experimental - Monitor & Wait</h3>
            <Badge variant="secondary">Low Maturity</Badge>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="space-y-2">
              <h4 className="font-semibold">Robotics</h4>
              <p className="text-sm text-muted-foreground">82.6% timeline reduction potential</p>
              <p className="text-xs">High barriers, let majors lead</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Predictive Maintenance</h4>
              <p className="text-sm text-muted-foreground">20% downtime reduction</p>
              <p className="text-xs">Requires IoT infrastructure</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Workforce Optimization</h4>
              <p className="text-sm text-muted-foreground">10% cost reduction potential</p>
              <p className="text-xs">Privacy concerns remain</p>
            </div>
          </div>
        </Card>
      </section>

      {/* Strategic Opportunities */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Lightbulb className="h-8 w-8" />
          Five Strategic Opportunities
        </h2>
        <div className="space-y-4">
          {[
            {
              title: "Fast-Follower Advantage",
              description: "Adopt battle-tested solutions proven by major competitors. Achieve 70-80% of capabilities with 10-20% of investment.",
              icon: <Target className="h-6 w-6" />
            },
            {
              title: "Design-Build Integration",
              description: "Leverage control of entire project lifecycle for AI integration impossible in traditional delivery methods.",
              icon: <Building2 className="h-6 w-6" />
            },
            {
              title: "Geographic Expansion",
              description: "Deploy AI capabilities developed in one market systematically across new markets for competitive advantage.",
              icon: <TrendingUp className="h-6 w-6" />
            },
            {
              title: "Workforce as Moat",
              description: "Create competitive advantage through comprehensive AI upskilling in tight labor market.",
              icon: <Shield className="h-6 w-6" />
            },
            {
              title: "Client Advisory Services",
              description: "Become trusted advisor on AI integration, writing specifications competitors can't meet.",
              icon: <Brain className="h-6 w-6" />
            }
          ].map((opportunity, index) => (
            <Card key={index} className="p-6">
              <div className="flex gap-4">
                <div className="text-blue-600">{opportunity.icon}</div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-xl font-semibold">{opportunity.title}</h3>
                  <p className="text-muted-foreground">{opportunity.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Implementation Roadmap */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">18-Month Implementation Roadmap</h2>
        
        <div className="space-y-6">
          {/* Phase 1 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-semibold">Phase 1: Foundation & Quick Wins</h3>
              <Badge>Months 1-6</Badge>
            </div>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Immediate Actions</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 shrink-0 mt-0.5" />
                      Designate Chief Innovation Officer with C-suite reporting
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 shrink-0 mt-0.5" />
                      Deploy Document Crunch across all projects
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 shrink-0 mt-0.5" />
                      Pilot Togal.AI on 5-10 projects
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 shrink-0 mt-0.5" />
                      Launch comprehensive AI literacy program
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Success Metrics</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                      AI budget established (1.5-2% of revenue)
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                      Document AI on 50+ active projects
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                      Cost estimation validated with time savings
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                      100% leadership trained on AI
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Phase 2 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-semibold">Phase 2: Scale Proven Use Cases</h3>
              <Badge>Months 6-12</Badge>
            </div>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Key Actions</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 shrink-0 mt-0.5" />
                      Deploy cost estimation AI across all bids
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 shrink-0 mt-0.5" />
                      Implement DroneDeploy Safety AI on high-risk projects
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 shrink-0 mt-0.5" />
                      Deploy Procore/Microsoft Copilot for PMs
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 shrink-0 mt-0.5" />
                      Establish 2-3 strategic vendor partnerships
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Expected Outcomes</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                      30%+ time reduction on estimates
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                      Measurable safety improvements
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                      50%+ PM adoption of AI tools
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                      Enterprise agreements secured
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Phase 3 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-semibold">Phase 3: Strategic Differentiation</h3>
              <Badge>Year 2</Badge>
            </div>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Strategic Initiatives</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 shrink-0 mt-0.5" />
                      Deploy BIM AI for design optimization
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 shrink-0 mt-0.5" />
                      Implement progress tracking across portfolio
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 shrink-0 mt-0.5" />
                      Deploy ALICE for complex project scheduling
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 shrink-0 mt-0.5" />
                      Develop comprehensive case study library
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Competitive Advantages</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                      Design-build AI integration leadership
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                      Real-time project visibility
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                      Documented ROI across use cases
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                      Market reputation as AI leader
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Investment & Returns */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <DollarSign className="h-8 w-8" />
          Investment Requirements & Expected Returns
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">First Year Investment</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>AI Leadership Team</span>
                <span className="font-semibold">$400-500K</span>
              </div>
              <div className="flex justify-between">
                <span>Software Subscriptions</span>
                <span className="font-semibold">$225-375K</span>
              </div>
              <div className="flex justify-between">
                <span>Hardware (cameras, drones)</span>
                <span className="font-semibold">$150-250K</span>
              </div>
              <div className="flex justify-between">
                <span>Training & Change Management</span>
                <span className="font-semibold">$200-300K</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total Year 1</span>
                <span>$975K-1.525M</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Expected Returns</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Cost Estimation Savings</span>
                <span className="font-semibold text-green-600">$1M+/year</span>
              </div>
              <div className="flex justify-between">
                <span>Schedule Optimization</span>
                <span className="font-semibold text-green-600">$25-32M/project</span>
              </div>
              <div className="flex justify-between">
                <span>Safety Improvements</span>
                <span className="font-semibold text-green-600">20% reduction</span>
              </div>
              <div className="flex justify-between">
                <span>Productivity Gains</span>
                <span className="font-semibold text-green-600">20-30%</span>
              </div>
              <Separator />
              <div className="text-sm text-muted-foreground">
                Based on documented results from Coastal Construction, Turner, DPR, and others
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Risks & Mitigation */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <AlertCircle className="h-8 w-8" />
          Technology Disruption Risks
        </h2>
        <div className="space-y-4">
          <Card className="p-6 border-l-4 border-l-red-500">
            <h3 className="text-xl font-semibold mb-2">Risk 1: Commoditization of Traditional Services</h3>
            <p className="text-muted-foreground mb-3">
              AI reduces time and cost for activities that currently differentiate contractors.
            </p>
            <div className="bg-muted/50 rounded p-4">
              <p className="text-sm"><strong>Mitigation:</strong> Shift value proposition from execution to advisory and integration. Charge premiums for AI-optimized outcomes.</p>
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-red-500">
            <h3 className="text-xl font-semibold mb-2">Risk 2: Technology-First New Entrants</h3>
            <p className="text-muted-foreground mb-3">
              AI-native startups attack from below while majors develop capabilities above.
            </p>
            <div className="bg-muted/50 rounded p-4">
              <p className="text-sm"><strong>Mitigation:</strong> Accelerate AI adoption before new entrants establish beachheads. Create data assets difficult to replicate.</p>
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-red-500">
            <h3 className="text-xl font-semibold mb-2">Risk 3: Client Capability Internalization</h3>
            <p className="text-muted-foreground mb-3">
              Large owners may bring AI capabilities in-house, reducing contractor reliance.
            </p>
            <div className="bg-muted/50 rounded p-4">
              <p className="text-sm"><strong>Mitigation:</strong> Develop integrated capabilities across design-build that owners can't replicate. Emphasize process integration over point solutions.</p>
            </div>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      <section className="space-y-6 pb-12">
        <Card className="p-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <h2 className="text-3xl font-bold mb-4">The Strategic Imperative</h2>
          <p className="text-lg mb-6">
            The window for fast-follower advantage remains open but closes by 2027. Firms that delay another year risk permanent disadvantage as AI-enabled competitors capture market share, develop data moats, attract best talent, and establish thought leadership positions difficult to displace.
          </p>
          <blockquote className="text-xl italic border-l-4 border-l-white pl-4">
            "The question for Alleato is whether to lead this transition or follow from behind."
          </blockquote>
        </Card>
      </section>
    </div>
  )
}