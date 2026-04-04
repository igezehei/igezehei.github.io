#!/bin/bash
# Security check script - Run before pushing to public GitHub

echo "🔒 Running security checks..."
echo ""

# Check 1: Ensure auth-config.json is not tracked
echo "✓ Checking if auth-config.json is git-ignored..."
if git ls-files | grep -q "auth-config.json"; then
    echo "❌ ERROR: auth-config.json is tracked by git! Remove it immediately:"
    echo "   git rm --cached auth-config.json"
    exit 1
else
    echo "✅ auth-config.json is properly ignored"
fi

# Check 2: Check for .DS_Store files
echo ""
echo "✓ Checking for .DS_Store files..."
if git ls-files | grep -q ".DS_Store"; then
    echo "⚠️  WARNING: .DS_Store files found in git. Remove them:"
    echo "   git rm --cached .DS_Store **/.DS_Store"
    git ls-files | grep ".DS_Store"
else
    echo "✅ No .DS_Store files tracked"
fi

# Check 3: Look for potential secrets in staged files
echo ""
echo "✓ Checking staged files for potential secrets..."
SUSPICIOUS=$(git diff --cached | grep -iE "(password|secret|api_key|private_key|token).*=.*['\"][^'\"]{8,}")
if [ ! -z "$SUSPICIOUS" ]; then
    echo "⚠️  WARNING: Found potential secrets in staged files:"
    echo "$SUSPICIOUS"
    echo ""
    echo "Please review these changes carefully!"
else
    echo "✅ No obvious secrets found in staged files"
fi

# Check 4: Verify example files have placeholder values only
echo ""
echo "✓ Checking example files..."
if grep -q "dev-xxxxxx" auth-config.example.json && grep -q "YOUR_AUTH0" auth-config.example.json; then
    echo "✅ auth-config.example.json contains only placeholders"
else
    echo "⚠️  WARNING: auth-config.example.json may contain real credentials!"
fi

# Check 5: Verify auth-config.json exists locally (optional check)
echo ""
echo "✓ Checking local configuration..."
if [ -f "auth-config.json" ]; then
    echo "✅ Local auth-config.json exists (for development)"
else
    echo "ℹ️  No local auth-config.json (Auth0 features will be disabled)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Security check complete!"
echo ""
echo "Safe to push if no errors were found."
echo "Review any warnings before proceeding."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
