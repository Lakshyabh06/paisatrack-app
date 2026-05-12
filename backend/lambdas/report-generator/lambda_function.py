import json
import os
import logging
from datetime import datetime, timedelta
import boto3
from collections import defaultdict, Counter
from decimal import Decimal

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['EXPENSES_TABLE'])


def lambda_handler(event, context):
    try:
        logger.info("Generating monthly report")

        today = datetime.utcnow()
        first_day = today.replace(day=1)
        last_month_end = first_day - timedelta(days=1)
        month_year = last_month_end.strftime("%Y-%m")

        # Scan table
        try:
            response = table.scan()
            items = response.get('Items', [])
        except Exception as e:
            logger.error(f"DynamoDB scan error: {str(e)}")
            return {"error": "Failed to fetch data"}

        # Convert Decimal
        items = [convert_decimal(i) for i in items]

        # Filter previous month
        items = [i for i in items if i['month_year'] == month_year]

        logger.info(f"Items found for {month_year}: {len(items)}")

        total = sum(i['amount'] for i in items)

        by_category = defaultdict(float)
        daily_spend = defaultdict(float)
        descriptions = []

        for i in items:
            amt = i['amount']
            by_category[i['category']] += amt
            daily_spend[i['date']] += amt
            descriptions.append(i['description'])

        daily_avg = total / len(daily_spend) if daily_spend else 0

        top_desc = Counter(descriptions).most_common(5)

        week_breakdown = defaultdict(float)
        for i in items:
            week = get_week(i['date'])
            week_breakdown[week] += i['amount']

        highest_day = (
            max(daily_spend.items(), key=lambda x: x[1])[0]
            if daily_spend else None
        )

        report = {
            "month": month_year,
            "total_spent": total,
            "by_category": dict(by_category),
            "daily_average": daily_avg,
            "top_descriptions": top_desc,
            "weekly_breakdown": dict(week_breakdown),
            "highest_spend_day": highest_day
        }

        logger.info(f"Report generated: {json.dumps(report)}")

        return report

    except Exception as e:
        logger.error(f"Unhandled error: {str(e)}")
        return {"error": "Failed to generate report"}


def convert_decimal(obj):
    if isinstance(obj, list):
        return [convert_decimal(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        return float(obj)
    else:
        return obj


def get_week(date_str):
    try:
        day = int(date_str.split("-")[2])
        return min((day - 1) // 7 + 1, 4)
    except Exception:
        return 1
