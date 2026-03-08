// ═══════════════════════════════════════════════════════════════════
//  JamiiAI Main Entry — All Systems Integration v3.0
//  File: index.js
// ═══════════════════════════════════════════════════════════════════

require('dotenv').config();

const { JamiiOrchestrator } = require('./agent-bot');
const { createContextEngine, ContextScheduler } = require('./context-engine');

async function bootstrap() {
  console.log('🚀 Starting JamiiAI v3.0...');
  
  try {
    // 1. Initialize Context Engine
    console.log('📡 Initializing Context Engine...');
    const contextEngine = await createContextEngine();
    
    // 2. Start Context Scheduler (auto-refresh trends)
    const contextScheduler = new ContextScheduler(contextEngine);
    contextScheduler.start();
    
    // 3. Initialize Orchestrator with Context
    console.log('🤖 Initializing Agent Orchestrator...');
    const orchestrator = new JamiiOrchestrator(contextEngine);
    
    // 4. Setup graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down...');
      await orchestrator.shutdown();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
    // 5. Start the system
    console.log('✅ JamiiAI v3.0 is running!');
    await orchestrator.start();
    
  } catch (error) {
    console.error('❌ Bootstrap failed:', error);
    process.exit(1);
  }
}

bootstrap();
