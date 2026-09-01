MEDO Integrity Server
=====================

1) Install Node.js LTS.

2) In this folder:
   npm install

3) Set environment variables in PowerShell:

   $env:REDIS_URL="redis://default:PASSWORD@HOST:6379"
   $env:ADMIN_TOKEN="YOUR_LONG_RANDOM_SECRET"
   $env:PORT="3000"

4) Start:
   npm start

5) Test:
   http://localhost:3000/
   http://localhost:3000/integrity

6) Set an MD5:

   Invoke-RestMethod `
     -Uri "http://localhost:3000/integrity" `
     -Method Post `
     -Headers @{ Authorization = "Bearer YOUR_LONG_RANDOM_SECRET" } `
     -ContentType "application/json" `
     -Body '{"hash":"9752b52389cc6402759c2050f0fc5266"}'

Important:
- Use HTTPS when exposed to the Internet.
- Do not put REDIS_URL or ADMIN_TOKEN in the C++ client.
- Keep POST /integrity protected.
