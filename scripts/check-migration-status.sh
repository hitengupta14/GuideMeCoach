#!/bin/bash

# Migration Helper Script
# Helps migrate remaining pages to use useSession hook

echo "🔄 Page Migration Helper"
echo "======================="
echo ""

# Find all pages still using old session pattern
echo "📋 Finding pages with old session fetch pattern..."
echo ""

grep -r "fetch('/api/auth/session'" src/app --include="*.tsx" -l | while read file; do
  echo "📄 $file"
done

echo ""
echo "✅ To migrate a page:"
echo "1. Import: import { useSession } from '@/hooks/useSession'"
echo "2. Replace: const { user, isLoading } = useSession()"
echo "3. Remove: useState, useEffect, and fetch logic"
echo "4. Update: change 'loading' to 'isLoading' in code"
echo ""
echo "📖 See OPTIMIZATION_IMPLEMENTATION_COMPLETE.md for examples"
