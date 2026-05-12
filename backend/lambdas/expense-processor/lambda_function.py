import json
import os
import logging
import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
ses = boto3.client('ses')
cognito = boto3.client('cognito-idp')

expenses_table = dynamodb.Table(os.environ['EXPENSES_TABLE'])
budgets_table = dynamodb.Table(os.environ['BUDGETS_TABLE'])

SENDER_EMAIL = os.environ['SENDER_EMAIL']
USER_POOL_ID = os.environ['USER_POOL_ID']


def get_user_email(user_id):
    try:
        response = cognito.admin_get_user(
            UserPoolId=USER_POOL_ID,
            Username=user_id
        )
        for attr in response['UserAttributes']:
            if attr['Name'] == 'email':
                return attr['Value']
    except Exception as e:
        logger.error(f"Error fetching user email: {str(e)}")

    return None


def send_email(user_email, subject, category, limit, spent):
    try:
        ses.send_email(
            Source=SENDER_EMAIL,
            Destination={"ToAddresses": [user_email]},
            Message={
                "Subject": {"Data": subject},
                "Body": {
                    "Html": {
                        "Data": f"""
                        <html>
                          <body style="font-family: Arial; padding: 20px;">
                            <h2 style="color:#16a34a;">PaisaTrack Alert</h2>

                            <p>Your <b>{category}</b> budget has been exceeded.</p>

                            <div style="background:#f9fafb;padding:15px;border-radius:8px;">
                              <p><b>Budget Limit:</b> ₹{limit}</p>
                              <p><b>Current Spend:</b> ₹{spent}</p>
                            </div>

                            <p style="margin-top:15px;">
                              Please review your expenses to stay on track.
                            </p>

                            <hr/>
                            <small style="color:#6b7280;">
                              PaisaTrack • Smart expense tracking
                            </small>
                          </body>
                        </html>
                        """
                    }
                },
            },
        )

        logger.info(f"Email sent to {user_email}")

    except Exception as e:
        logger.error(f"Email error: {str(e)}")


def lambda_handler(event, context):
    for record in event['Records']:
        try:
            body = json.loads(record['body'], parse_float=Decimal)
            logger.info(f"Processing message: {body}")

            message_type = body.get("type", "expense")

            # =========================
            # 🔹 HANDLE BUDGET
            # =========================
            if message_type == "budget":
                try:
                    budgets_table.put_item(
                        Item={
                            "user_id": body["user_id"],
                            "category": body["category"],
                            "monthly_limit": body["amount"],
                            "created_at": body["created_at"]
                        }
                    )
                    logger.info("Budget saved successfully")
                except Exception as e:
                    logger.error(f"Budget save error: {str(e)}")

                continue

            # =========================
            # 🔹 HANDLE EXPENSE
            # =========================
            try:
                expenses_table.put_item(Item=body)
                logger.info("Saved expense to DynamoDB")
            except Exception as e:
                logger.error(f"DynamoDB error: {str(e)}")
                continue

            user_id = body['user_id']
            category = body['category']
            month_year = body['month_year']

            # =========================
            # 🔹 GET USER EMAIL
            # =========================
            user_email = get_user_email(user_id)

            if not user_email:
                logger.error("User email not found")
                continue

            # =========================
            # 🔹 QUERY EXPENSES
            # =========================
            try:
                response = expenses_table.query(
                    IndexName='MonthIndex',
                    KeyConditionExpression=Key('user_id').eq(user_id) & Key('month_year').eq(month_year)
                )
                items = response.get('Items', [])
                logger.info(f"Fetched {len(items)} items from DB")
            except Exception as e:
                logger.error(f"Query error: {str(e)}")
                continue

            category_total = sum(
                float(item['amount']) for item in items if item['category'] == category
            )

            total_spending = sum(
                float(item['amount']) for item in items
            )

            # =========================
            # 🔹 CATEGORY BUDGET CHECK
            # =========================
            try:
                budget_resp = budgets_table.get_item(
                    Key={'user_id': user_id, 'category': category}
                )
                budget_item = budget_resp.get('Item')
            except Exception as e:
                logger.error(f"Budget fetch error: {str(e)}")
                continue

            if budget_item:
                limit = float(budget_item['monthly_limit'])
                logger.info(f"Category total: {category_total}, Limit: {limit}")

                if category_total > limit:
                    logger.info("Category budget exceeded → sending email")

                    subject = f"⚠️ Budget Alert: {category} limit exceeded"

                    send_email(
                        user_email,
                        subject,
                        category,
                        limit,
                        category_total
                    )

            # =========================
            # 🔹 TOTAL BUDGET CHECK
            # =========================
            try:
                total_budget_resp = budgets_table.get_item(
                    Key={'user_id': user_id, 'category': 'TOTAL'}
                )
                total_budget_item = total_budget_resp.get('Item')
            except Exception as e:
                logger.error(f"Total budget fetch error: {str(e)}")
                total_budget_item = None

            if total_budget_item:
                total_limit = float(total_budget_item['monthly_limit'])

                if total_spending > total_limit:
                    logger.info("Total budget exceeded → sending email")

                    subject = "⚠️ Total Budget Exceeded"

                    send_email(
                        user_email,
                        subject,
                        "Total",
                        total_limit,
                        total_spending
                    )

        except Exception as e:
            logger.error(f"Processing error: {str(e)}")

    return {"statusCode": 200}
