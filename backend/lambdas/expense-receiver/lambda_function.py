import json
import os
import uuid
import logging
from datetime import datetime
import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sqs = boto3.client('sqs')
QUEUE_URL = os.environ['QUEUE_URL']


def lambda_handler(event, context):
    try:
        logger.info(f"Event received: {json.dumps(event)}")

        path = event.get("resource") or event.get("path")  # ✅ NEW

        try:
            body = json.loads(event.get('body', '{}'))
        except json.JSONDecodeError:
            return response(400, "Invalid JSON format")

        # =========================
        # ✅ EXPENSE FLOW (NO CHANGE)
        # =========================
        if path == "/expense":

            required_fields = ['user_id', 'amount', 'category', 'description', 'date']

            for field in required_fields:
                if field not in body or not body[field]:
                    return response(400, f"Missing or empty field: {field}")

            try:
                amount = float(body['amount'])
                if amount <= 0:
                    return response(400, "Amount must be greater than 0")
            except ValueError:
                return response(400, "Amount must be a valid number")

            try:
                datetime.strptime(body['date'], "%Y-%m-%d")
            except ValueError:
                return response(400, "Invalid date format. Use YYYY-MM-DD")

            expense_id = str(uuid.uuid4())
            created_at = datetime.utcnow().isoformat()
            month_year = body['date'][:7]

            message = {
                "type": body.get("type", "expense"),
                "user_id": body['user_id'],
                "expense_id": expense_id,
                "amount": amount,
                "category": body['category'],
                "description": body['description'],
                "date": body['date'],
                "month_year": month_year,
                "created_at": created_at
            }

            sqs.send_message(
                QueueUrl=QUEUE_URL,
                MessageBody=json.dumps(message)
            )

            logger.info(f"Queued expense: {expense_id}")
            return response(200, {"expense_id": expense_id})

        # =========================
        # ✅ BUDGET FLOW (NEW)
        # =========================
        elif path == "/budgets":

            required_fields = ['user_id', 'amount', 'category', 'description', 'date']

            for field in required_fields:
                if field not in body or not body[field]:
                    return response(400, f"Missing or empty field: {field}")

            try:
                amount = float(body['amount'])
                if amount <= 0:
                    return response(400, "Amount must be greater than 0")
            except ValueError:
                return response(400, "Amount must be a valid number")

            try:
                datetime.strptime(body['date'], "%Y-%m-%d")
            except ValueError:
                return response(400, "Invalid date format. Use YYYY-MM-DD")

            budget_id = str(uuid.uuid4())
            created_at = datetime.utcnow().isoformat()
            month_year = body['date'][:7]

            message = {
                "type": "budget",  # ✅ IMPORTANT DIFFERENTIATOR
                "user_id": body['user_id'],
                "budget_id": budget_id,
                "amount": amount,
                "category": body['category'],
                "description": body['description'],
                "date": body['date'],
                "month_year": month_year,
                "created_at": created_at
            }

            sqs.send_message(
                QueueUrl=QUEUE_URL,
                MessageBody=json.dumps(message)
            )

            logger.info(f"Queued budget: {budget_id}")
            return response(200, {"budget_id": budget_id})

        else:
            return response(400, "Invalid path")

    except Exception as e:
        logger.error(f"Error occurred: {str(e)}")
        return response(500, "Internal server error")


def response(status, body):
    return {
        "statusCode": status,
        "headers": cors_headers(),
        "body": json.dumps(body)
    }


def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    }
