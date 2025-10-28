// Script to update the payments table schema
import { SQLiteClient } from './infrastructure/database/sqlite-client';

async function updatePaymentsSchema() {
  console.log('🔄 Updating payments table schema...');
  
  try {
    const sqliteClient = new SQLiteClient();
    const db = sqliteClient.getDatabase();

    // Check if updated_at column exists
    const checkColumn = db.prepare(`
      SELECT COUNT(*) as count FROM pragma_table_info('payments') WHERE name = 'updated_at'
    `);
    
    const result = checkColumn.get() as { count: number };
    
    if (result.count === 0) {
      console.log('📋 Adding updated_at column to payments table...');
      
      // Add the updated_at column
      const alterTable = db.prepare(`
        ALTER TABLE payments ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      `);
      
      alterTable.run();
      console.log('✅ Successfully added updated_at column to payments table');
    } else {
      console.log('✅ updated_at column already exists in payments table');
    }

    // Check if payment_method constraint exists
    const checkConstraint = db.prepare(`
      SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'payments'
    `);
    
    const tableInfo = checkConstraint.get() as { sql: string };
    
    if (!tableInfo.sql.includes('CHECK (payment_method IN')) {
      console.log('📋 Updating payment_method constraint...');
      
      // For SQLite, we need to recreate the table to add constraints
      // This is a simplified approach - in production you'd use a proper migration
      console.log('⚠️  Note: To add payment_method constraint, the table would need to be recreated');
    } else {
      console.log('✅ payment_method constraint already exists');
    }

    console.log('🎉 Payments table schema update completed!');
    
  } catch (error) {
    console.error('❌ Failed to update payments table schema:', error);
  }
}

// Run the update
updatePaymentsSchema().catch(console.error);
