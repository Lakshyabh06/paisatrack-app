import json
import os
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')

expense_table = dynamodb.Table(os.environ['EXPENSE_TABLE'])
budget_table = dynamodb.Table(os.environ['BUDGET_TABLE'])


def decimal_to_float(obj):
    if isinstance(obj, list):
        return [decimal_to_float(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        return float(obj)
    return obj


def lambda_handler(event, context):
    try:
        http_method = event.get("httpMethod")
        query = event.get("queryStringParameters") or {}

        user_id = query.get("user_id")

        # 🔥 GET EXPENSES
        if http_method == "GET" and "month_year" in query:
            month_year = query.get("month_year")

            response = expense_table.scan()
            items = response.get("Items", [])

            # filter
            items = [
                i for i in items
                if i.get("user_id") == user_id and i.get("month_year") == month_year
            ]

            total = sum(float(i['amount']) for i in items)
            count = len(items)

            by_category = {}
            for i in items:
                cat = i['category']
                by_category[cat] = by_category.get(cat, 0) + float(i['amount'])

            return response_builder(200, {
                "expenses": decimal_to_float(items),
                "total": total,
                "count": count,
                "by_category": by_category
            })

        # 🔥 GET BUDGETS
        elif http_method == "GET":
            response = budget_table.scan()
            items = response.get("Items", [])

            items = [i for i in items if i.get("user_id") == user_id]

            return response_builder(200, {
                "budgets": decimal_to_float(items)
            })

        return response_builder(404, {"message": "Not found"})

    except Exception as e:
        print("ERROR:", str(e))  # 👈 important for logs
        return response_builder(500, {"message": "Internal server error"})


def response_builder(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "GET, OPTIONS"
        },
        "body": json.dumps(body)
    }
