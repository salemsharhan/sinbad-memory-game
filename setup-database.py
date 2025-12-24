#!/usr/bin/env python3
"""
Setup Supabase Database for Sinbad Memory Game
This script executes the SQL migration to create all necessary tables.
"""

import requests
import sys

# Supabase Configuration
SUPABASE_URL = "https://jytgfxwvxbinkwyuwerh.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5dGdmeHd2eGJpbmt3eXV3ZXJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU3OTMyOCwiZXhwIjoyMDgyMTU1MzI4fQ.qO3ijTFfFfLDoedeTNGHMp0ULg4jbZh8dNzblbqOlzk"

def execute_sql(sql_statements):
    """Execute SQL statements via Supabase REST API"""
    
    # Split SQL into individual statements
    statements = [s.strip() for s in sql_statements.split(';') if s.strip()]
    
    print(f"📊 Executing {len(statements)} SQL statements...")
    
    success_count = 0
    error_count = 0
    
    for i, statement in enumerate(statements, 1):
        if not statement:
            continue
            
        print(f"\n[{i}/{len(statements)}] Executing statement...")
        
        # Use Supabase SQL endpoint
        url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
        headers = {
            "apikey": SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "query": statement
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            
            if response.status_code in [200, 201, 204]:
                print(f"✅ Success")
                success_count += 1
            else:
                print(f"⚠️  Warning: {response.status_code} - {response.text[:200]}")
                error_count += 1
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            error_count += 1
    
    print(f"\n{'='*60}")
    print(f"✅ Successful: {success_count}")
    print(f"❌ Errors: {error_count}")
    print(f"{'='*60}")
    
    return error_count == 0

def main():
    print("🚀 Sinbad Memory Game - Database Setup")
    print("="*60)
    
    # Read SQL migration file
    try:
        with open('supabase/migrations/20241224_create_sinbad_tables.sql', 'r', encoding='utf-8') as f:
            sql_content = f.read()
    except FileNotFoundError:
        print("❌ Error: SQL migration file not found!")
        print("   Expected: supabase/migrations/20241224_create_sinbad_tables.sql")
        sys.exit(1)
    
    print(f"📄 SQL file loaded ({len(sql_content)} characters)")
    
    # Execute SQL
    success = execute_sql(sql_content)
    
    if success:
        print("\n✅ Database setup completed successfully!")
        print("\nNext steps:")
        print("1. Run: npm run dev")
        print("2. Open: http://localhost:3000")
        print("3. Create a teacher account and start using the app!")
    else:
        print("\n⚠️  Some errors occurred during setup.")
        print("You may need to execute the SQL manually in Supabase Dashboard:")
        print(f"1. Go to: {SUPABASE_URL}")
        print("2. Open SQL Editor")
        print("3. Copy content from: supabase/migrations/20241224_create_sinbad_tables.sql")
        print("4. Click 'Run'")

if __name__ == "__main__":
    main()
