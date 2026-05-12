import json
import boto3

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("PaisaTrackExpenses")  # change this

def lambda_handler(event, context):
    print("EVENT:", json.dumps(event))

    method = event["httpMethod"]

    user_id = event["queryStringParameters"]["user_id"]
    expense_id = event["pathParameters"]["expense_id"]

    # ✅ DELETE
    if method == "DELETE":
        table.delete_item(
            Key={
                "user_id": user_id,
                "expense_id": expense_id
            }
        )

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({"message": "Deleted"})
        }

    # ✅ UPDATE (PUT)
    if method == "PUT":
        body = json.loads(event["body"])

        table.update_item(
            Key={
                "user_id": user_id,
                "expense_id": expense_id
            },
            UpdateExpression="SET amount = :a, category = :c, description = :d",
            ExpressionAttributeValues={
                ":a": body["amount"],
                ":c": body["category"],
                ":d": body["description"]
            }
        )

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({"message": "Updated"})
        }

    return {
        "statusCode": 400,
        "headers": {
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps({"message": "Invalid request"})
    }
