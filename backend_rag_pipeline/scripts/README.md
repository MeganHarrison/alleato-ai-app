# Insights Management Scripts

## 🎯 **PROBLEM SOLVED**
Your RAG system was generating too many insights (up to 51 per document!). These scripts fix that by implementing strict limits and cleaning up existing over-generated insights.

## 📁 **ORGANIZED STRUCTURE**
```
backend_rag_pipeline/
├── scripts/                          ← All management scripts here
│   ├── cleanup_insights.py           ← Clean up existing over-generated insights
│   ├── test_single_document.py       ← Test new limits on one document  
│   ├── test_insight_limits.py        ← Verify limits prevent over-generation
│   └── README.md                     ← This file
├── insights/enhanced/
│   └── business_insights_engine.py   ← Updated engine with strict limits
└── .env                              ← Your environment variables
```

## 🚀 **HOW TO RUN**

### **Step 1: Navigate to Project**
```bash
cd /Users/meganharrison/Documents/github/ai-agent-mastery3/6_Agent_Deployment/backend_rag_pipeline
```

### **Step 2: Clean Up Existing Mess**
```bash
python scripts/cleanup_insights.py
```
**What it does:**
- Finds your 979 insights across 259 documents
- Identifies documents with >5 insights (like that one with 51!)
- Keeps only the top 5 per document (by quality score)
- Deletes the rest (~400-500 low-quality ones)

### **Step 3: Test New Limits Work**
```bash
python scripts/test_insight_limits.py
```
**What it does:**
- Tests a very detailed document that would generate 20+ insights with old system
- Verifies new system generates only 2-5 high-quality insights
- Shows you the quality difference

### **Step 4: Test Single Document**
```bash
python scripts/test_single_document.py
```
**What it does:**
- Processes one sample meeting document
- Shows exactly what insights the AI extracts
- Verifies meeting dates are working

## 📊 **WHAT YOU'LL GET**

### **BEFORE (Your Current Data):**
```
"2023-10-10 - UB Dallas Schedule Review" → 51 insights! 😱
Including routine ones like:
• "Meeting discussed timeline"
• "Attendees reviewed agenda"  
• "Team mentioned concerns"
• ... 48 more routine insights
```

### **AFTER (Cleaned Up):**
```
"2023-10-10 - UB Dallas Schedule Review" → 5 insights ✅
Only business-critical ones like:
• "Critical Budget Overrun - $50K Above Projections"
• "Timeline Delay Risk - Project Behind by 3 Weeks"
• "Key Stakeholder Departure - Immediate Action Required"
• "Compliance Deadline - October 31st Critical"
• "Resource Shortage - 2 Additional Staff Needed"
```

## ⚠️ **REQUIREMENTS**
```bash
pip install supabase python-dotenv openai
```

## 🎯 **SUCCESS METRICS**
- **Before:** 979 insights (average 3.8 per doc, max 51 per doc)
- **After:** ~500-600 insights (max 5 per doc, high-quality only)
- **Result:** RAG system becomes actually useful instead of overwhelming

## 🔧 **TROUBLESHOOTING**

### **Missing Dependencies:**
```bash
pip install supabase python-dotenv openai
```

### **Environment Variables Not Found:**
Check your `.env` file has:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY` 
- `OPENAI_API_KEY`

### **Database Connection Issues:**
1. Verify you ran the SQL to add `document_date` column
2. Check Supabase permissions
3. Ensure OpenAI has available credits

## 🎉 **EXPECTED OUTCOME**
- ✅ Much cleaner, focused insights
- ✅ RAG recommendations become actually useful
- ✅ Users will read insights instead of ignoring them
- ✅ Meeting dates work for time-based prioritization

**Run the cleanup script first to fix your existing mess!**
