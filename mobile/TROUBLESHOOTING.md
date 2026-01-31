# Mobile App Troubleshooting Guide

## API Connection Issues

### Network Timeout Errors

If you see `Network request timed out` errors:

1. **Check your local IP address:**
   ```bash
   ifconfig | grep "inet " | grep -v "127.0.0.1"
   ```

2. **Update the IP in mobile config:**
   - Edit `mobile/src/config/api.ts`
   - Update `LOCAL_IP` constant with your current IP
   - Your IP may change when switching networks

3. **Verify backend is running:**
   ```bash
   lsof -i :3000
   ```

4. **Test API connectivity:**
   ```bash
   curl http://YOUR_IP:3000/api/auth/login -X POST \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"test"}'
   ```

### Platform-Specific Configuration

- **iOS Simulator**: Uses your computer's local IP (e.g., `192.168.x.x`)
- **Android Emulator**: Uses `10.0.2.2` (special IP for host machine)
- **Physical Devices**: Must use your computer's local network IP

### Common Issues

1. **Firewall blocking**: Ensure port 3000 is allowed
2. **Different network**: Phone and computer must be on same WiFi
3. **VPN active**: May block local network access
4. **IP changed**: Your router may assign new IPs periodically

### Quick Fix

If the API isn't connecting:
```bash
# Get your IP
ifconfig | grep "inet " | grep -v "127.0.0.1"

# Update mobile/src/config/api.ts with the new IP
# Reload the mobile app
```
