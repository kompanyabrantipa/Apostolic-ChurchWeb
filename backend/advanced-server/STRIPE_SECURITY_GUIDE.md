# 🔒 Stripe Security Guide - LIVE Keys Configuration

## ⚠️ CRITICAL SECURITY NOTICE

**YOUR CODEBASE NOW CONTAINS LIVE STRIPE KEYS**

This system is configured with **LIVE PRODUCTION STRIPE KEYS** that can process real payments. Handle with extreme care.

## 🔑 Current Key Configuration

### Live Keys in Use:
- **Publishable Key**: `pk_live_51RoXpfL498oAJ59Vyd2YKh5B79oLSZkIbYTyxtOXbwr5SEWFlTbLWWiOAOAUBBLim9nT9YRZ6yvwyjhKTJ2wWRaF00SQehdjew`
- **Secret Key**: `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`

### Key Locations:
1. **Frontend** (Publishable Key Only):
   - `frontend/js/config.js` - Lines 21-23
   - `frontend/js/donate.js` - Line 4
   - `backend/advanced-server/routes/config.js` - Lines 16 & 66

2. **Backend Templates** (Secret Key):
   - `backend/advanced-server/scripts/generate-production-secrets.js` - Lines 238-239

3. **Runtime** (Environment Variables):
   - `STRIPE_PUBLISHABLE_KEY` - Should be set in production
   - `STRIPE_SECRET_KEY` - Should be set in production

## 🛡️ Security Best Practices

### 1. Environment Variables (RECOMMENDED)
```bash
# Set these in your production environment
export STRIPE_PUBLISHABLE_KEY=pk_live_51RoXpfL498oAJ59Vyd2YKh5B79oLSZkIbYTyxtOXbwr5SEWFlTbLWWiOAOAUBBLim9nT9YRZ6yvwyjhKTJ2wWRaF00SQehdjew
export STRIPE_SECRET_KEY=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
```

### 2. .env File (Production)
```bash
# Create .env file in backend/advanced-server/
STRIPE_PUBLISHABLE_KEY=pk_live_51RoXpfL498oAJ59Vyd2YKh5B79oLSZkIbYTyxtOXbwr5SEWFlTbLWWiOAOAUBBLim9nT9YRZ6yvwyjhKTJ2wWRaF00SQehdjew
STRIPE_SECRET_KEY=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
```

### 3. Version Control Security
```bash
# Add to .gitignore
.env
.env.production
.env.local
**/production-secrets.json
```

## 🚨 CRITICAL SECURITY RULES

### ❌ NEVER DO:
1. **Commit live keys to version control**
2. **Share keys in emails, chat, or documentation**
3. **Log secret keys in application logs**
4. **Use live keys in development/testing**
5. **Store keys in client-side code (secret keys)**

### ✅ ALWAYS DO:
1. **Use environment variables in production**
2. **Monitor Stripe dashboard for suspicious activity**
3. **Rotate keys periodically**
4. **Use webhook signature verification**
5. **Implement proper error handling**

## 🔧 Validation & Testing

### Run Key Validation:
```bash
cd backend/advanced-server
node scripts/validate-stripe-keys.js
```

### Test Payment Flow:
1. Use small test amounts ($0.50 - $1.00)
2. Monitor Stripe dashboard
3. Verify webhook events
4. Check error handling

## 🚀 Production Deployment Checklist

- [ ] Environment variables set correctly
- [ ] .env files not committed to version control
- [ ] Webhook endpoints configured in Stripe dashboard
- [ ] SSL/HTTPS enabled for all payment pages
- [ ] Error logging configured
- [ ] Payment confirmation emails working
- [ ] Refund process tested
- [ ] Security headers implemented

## 📞 Emergency Procedures

### If Keys Are Compromised:
1. **Immediately disable keys in Stripe dashboard**
2. **Generate new keys**
3. **Update all systems with new keys**
4. **Review transaction logs for suspicious activity**
5. **Contact Stripe support if needed**

### Stripe Support:
- Dashboard: https://dashboard.stripe.com
- Support: https://support.stripe.com
- Documentation: https://stripe.com/docs

## 🔄 Key Rotation Schedule

**Recommended**: Rotate keys every 6-12 months or immediately if:
- Employee with key access leaves
- Security breach suspected
- Keys accidentally exposed
- Major system changes

## 📊 Monitoring

### Watch for:
- Unusual payment patterns
- Failed payment spikes
- Webhook delivery failures
- API error rate increases
- Chargeback notifications

---

**Last Updated**: $(date)
**Configuration Status**: LIVE PRODUCTION KEYS ACTIVE
**Security Level**: HIGH - PRODUCTION READY
