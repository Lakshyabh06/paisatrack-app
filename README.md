# PaisaTrack 💸

A simple full-stack expense tracking app to manage daily spending and budgets.

---

## What it does

- Add and track your daily expenses  
- Set monthly budgets by category  
- Get alerts when budget is exceeded  
- View spending trends and recent transactions  

---

## Tech used

Frontend:
- React + Vite  
- Chart.js (for graphs)

Backend:
- AWS Lambda (serverless functions)  
- API Gateway  

Database:
- DynamoDB  

Other services:
- AWS Cognito (authentication)  
- S3 + CloudFront (hosting frontend)  
- SES (email alerts)  
- SQS (for processing expenses async)  
- CloudWatch (logs & monitoring)  

---

## Project structure

frontend/          -> React app  
backend/lambdas/   -> All Lambda functions  

---

## How it works (flow)

1. User logs in using Cognito  
2. Adds expense from frontend  
3. API Gateway triggers Lambda  
4. Expense goes to SQS queue  
5. Processor Lambda reads it and stores in DynamoDB  
6. Budget check happens  
7. If limit exceeds → email sent using SES  

---

## Features implemented

- Auth system (signup/login with OTP)  
- Expense CRUD  
- Budget tracking  
- Email alerts on limit exceed  
- Dashboard with charts  

---

## Deployment

- Frontend deployed on S3  
- Served via CloudFront  
- Backend fully serverless (Lambda + API Gateway)  


