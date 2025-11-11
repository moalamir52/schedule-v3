class AIService {
  constructor() {
    if (process.env.HF_TOKEN) {
      this.hfToken = process.env.HF_TOKEN;
      this.hasAPI = true;
      } else {
      this.hasAPI = false;
    }
  }

  async askQuestion(question, businessData) {
    // Try HF Chat API first, fallback if needed
    if (!this.hasAPI) {
      return this.getFallbackResponse(question, businessData);
    }

    try {
      const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.hfToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `You are a car wash business consultant. Based on this data: Revenue: ${businessData.totalRevenue} AED, Clients: ${businessData.activeClients}. Question: ${question}. Give practical advice.`
            }
          ],
          model: 'microsoft/DialoGPT-medium'
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      const text = result.choices?.[0]?.message?.content || 'Sorry, could not generate response.';
      return text;
    } catch (error) {
      return this.getFallbackResponse(question, businessData);
    }
  }

  getFallbackResponse(question, data) {
    switch(question) {
      case 'How to increase revenue by 20%?':
        return `To increase revenue by 20% (+${Math.floor(data.totalRevenue * 0.2)} AED):

📈 **Direct Strategies:**
• Add ${Math.ceil(data.activeClients * 0.15)} new clients
• Upgrade 30% of existing clients to higher packages
• Introduce additional services (rain cleaning, monthly polishing)

💡 **Action Plan:**
1. Target empty villas in the same compound
2. Offer upgrade promotions to current clients
3. Add garage cleaning service (50 AED/month)`;
      
      case 'When to hire a new worker?':
        const tasksPerWorker = data.totalAssignments / (data.workers || 3);
        return `Based on current analysis:

📊 **Current Status:**
• Average tasks per worker: ${tasksPerWorker.toFixed(1)} tasks
• Optimal range: 20-25 tasks per worker

⏰ **Recommended Timing:**
${tasksPerWorker > 25 ? 
  '🔴 **NOW!** Workers are overloaded' : 
  tasksPerWorker > 20 ? 
    '🟡 **Within a month** when reaching 25 tasks/worker' :
    '🟢 **Not needed currently** - optimal workload'
}

💰 **Cost vs Return:**
• New worker cost: ~2000 AED/month
• Expected return: ~3000 AED/month from additional clients`;
      
      case 'Which package is most profitable?':
        return `Package profitability analysis:

🏆 **Most Popular:** ${data.mostPopularPackage || 'N/A'}

💰 **Profitability Analysis:**
• 3x/week packages: Highest profit (300+ AED)
• 2x/week packages: Medium profit (200-250 AED)
• 1x/week packages: Lower profit (100-150 AED)

📈 **Optimization Strategy:**
• Focus on upgrading clients to higher packages
• Offer 10% discount for upgrading from 2x to 3x weekly
• Add premium services to high-tier packages`;
      
      case 'How to reduce operational costs?':
        return `To reduce operational costs:

💧 **Water & Materials Savings:**
• Use water recycling system (save 40%)
• Buy materials in bulk (save 25%)
• Reduce unnecessary chemical usage

⛽ **Fuel Savings:**
• Smart route planning (save 30% fuel)
• Group clients in same area
• Use fuel-efficient vehicles

👷 **Efficiency Improvements:**
• Train workers to reduce service time
• Regular equipment maintenance
• Minimize material waste

💰 **Expected Savings:** 15-25% of monthly costs`;
      
      default:
        return `🤖 **AI Business Analysis:**

📊 **Your Current Performance:**
• Total Revenue: ${data.totalRevenue.toLocaleString()} AED
• Active Clients: ${data.activeClients}
• Average per Client: ${Math.floor(data.avgRevenue)} AED
• Worker Efficiency: ${data.totalAssignments ? Math.floor(data.totalAssignments / (data.workers || 3)) : 'N/A'} tasks/worker

💡 **Smart Recommendations:**
• **Revenue Growth**: Target ${Math.ceil(data.activeClients * 0.2)} new clients for 20% growth
• **Package Optimization**: Focus on upgrading to premium packages
• **Operational Efficiency**: ${data.totalAssignments > 75 ? 'Consider hiring additional worker' : 'Current capacity is optimal'}

🎯 **Quick Wins:**
• Add garage cleaning service (+50 AED/client)
• Offer seasonal packages (rain protection)
• Implement referral program (10% discount)

❓ **Ask specific questions from the menu above for detailed strategies!**`;
    }
  }
}

module.exports = new AIService();