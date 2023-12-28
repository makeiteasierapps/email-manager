# API Documentation

This document provides information on the various endpoints provided by this API.

## Table of Contents

- [Process CSV](#process-csv)
- [Fetch Email Data](#fetch-email-data)
- [Follow Up Emails](#follow-up-emails)
- [Send Custom Email](#send-custom-email)
- [Send Multiple Emails](#send-multiple-emails)
- [Webhook Listener](#webhook-listener)

---

### Process CSV

- **Endpoint:** `/process_csv`
- **Method:** `POST`
- **Authentication:** Required

**Request:**
- The request should be a multipart/form-data POST request.
- The body of the request should include a .csv file with 'file' as the key.

**Response:**
- If the request is successful, a JSON object with two keys, `data_list` and `email_templates` will be returned.
- If the request is unsuccessful, the API will return an error message.

**Sample Response:**
```json
{
    "data_list": [
        {
            "first_name": "John",
            "email": "john@example.com",
            "company": "Example Company"
        },
        {
            "first_name": "Jane",
            "email": "jane@example.com",
            "company": "Another Company"
        }
    ],
    "email_templates": [
        {
            "recipient_name": "John",
            "recipient_company": "Example Company",
            "email": "john@example.com",
            "subject": "New Opportunities for Example Company",
            "message": "Email Message"
        },
        {
            "recipient_name": "Jane",
            "recipient_company": "Another Company",
            "email": "jane@example.com",
            "subject": "New Opportunities for Another Company",
            "message": "Email Message"
        }
    ]
}
```


---

### Fetch Email Data

- **Endpoint:** `/fetch_email_data`
- **Method:** `GET`
- **Authentication:** Required

**Response:**
- If the request is successful, a JSON object with two keys, `email_data` and `message` will be returned.
- If unsuccessful a JSON object with one key, `message`, will be returned with a 500 status code.

**Sample Response:** 
```json
{
    "message": "Email data fetched successfully"
    "email_data": [
        {
            "recipient_email": "john@example.com",
            "recipient_name": "John",
            "recipient_company": "Example Company",
            "sender_name": "Alex",
            "sent_timestamp": "Wed, 27 Dec 2023 23:27:27 GMT",
            "follow_up_1_sent": "False",
            "follow_up_2_sent": "False",
            "response_received": "False",
        }
    ]
}
```


---

### Follow Up Emails

- **Endpoint:** `/follow_up_emails`
- **Method:** `GET`
- **Authentication:** Required

**Request:**
- This endpoint is expected to be hit by a cron job every 24 hours. It will send follow up emails to recipients who have not responded to the initial email.

**Response:**
- If the request is successful, a JSON object with two keys, `follow_ups_sent` and `message` will be returned.
- If unsuccessful a JSON object with one key, `message`, will be returned with a 500 status code.

**Sample Response:**

```json
{
	"follow_ups_sent": [
		{
			"follow_up_number": 1,
			"recipient_brand": "Shaun Systems",
			"recipient_email": "Test@yahoo.com",
			"recipient_name": "Shaun",
			"senders_name": "John Doe"
		},

	],
	"message": "Follow up emails handled successfully"
}
```


---

### Send Custom Email

- **Endpoint:** `/send_custom`
- **Method:** `POST`
- **Authentication:** Required

**Request:**
```json
{   "user_id": "userID",
    "sender_email": "John@sample.com",
    "sender_name": "John Doe",
    "recipient_email": "John@example.com",
    "recipient_name": "Jane Doe",
    "recipient_company": "Example Company",
    "subject": "New Opportunities for Example Company",
    "message": "Email Message",
}
```


**Response:**
- Success: A string with the message 'Email sent successfully' and a 200 status code.
- Failure: If an error occurs before sending the email, a string with an appropriate error message and status code will be returned.

---

### Send Multiple Emails

- **Endpoint:** `/send_multiple`
- **Method:** `POST`
- **Authentication:** Required

**Request:**
```json
{
    "user_id": "sampleUser",
    "email_templates": [
        {
            "email": "johndoe@example.com",
            "message": "Email Message",
            "recipient_company": "Example Company",
            "recipient_name": "John Doe",
            "subject": "New Opportunities for Example Company"
        }
    ]
```

**Response:**
- Success: A string with the message 'All emails sent successfully' and a 200 status code.
- Failure: If no emails are sent or an error occurs before sending emails, a string with an appropriate error message and status code will be returned.

---

### Webhook Listener

- **Endpoint:** `/webhook/listen`
- **Method:** `POST`
- **Authentication:** Required (Mailgun authentication)

This endpoint is designed to handle webhooks from Mailgun. It listens for replies to sent emails and updates the "response_received" field to true in the database for the corresponding email.

When a reply to an email is received, Mailgun sends a POST request to this endpoint with the sender's email address in the form data. The function then queries the database for emails where the 'recipient_email' matches the sender's email address. For each matching document, it updates the 'response_received' field to true.

Please note that this is not an endpoint that can be accessed directly by users. It requires setup on the Mailgun side to send webhooks to this endpoint when email replies are received.

## Authorization

To access endpoints that require authorization, you need to include an `Auth-Key` in the header of your HTTP request.

The `Auth-Key` is a secret key that should match the `MY_AUTH_KEY` environment variable on the server.

